from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from alunos.models import Aluno
from professores.models import Lecionacao

from .importers import parse_note, preview_pct_results
from .models import PCT, ResultadoPCT
from .serializers import PCTLecionacaoInfoSerializer, PCTSerializer, ResultadoPCTSerializer


class PCTPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class PCTViewSet(viewsets.ModelViewSet):
    serializer_class = PCTSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PCTPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'lecionacao__professor__nome',
        'lecionacao__disciplina__nome',
        'lecionacao__turma__classe',
        'lecionacao__turma__sala',
        'lecionacao__ano_lectivo',
        'observacao',
    ]
    ordering_fields = [
        'data_aplicacao',
        'trimestre',
        'lecionacao__professor__nome',
        'lecionacao__turma__classe',
    ]
    ordering = ['-data_aplicacao', 'trimestre']

    def get_queryset(self):
        queryset = PCT.objects.select_related(
            'lecionacao__professor',
            'lecionacao__disciplina',
            'lecionacao__turma',
        ).all()
        professor = self.request.query_params.get('professor')
        disciplina = self.request.query_params.get('disciplina')
        turma = self.request.query_params.get('turma')
        ano_lectivo = self.request.query_params.get('ano_lectivo')
        trimestre = self.request.query_params.get('trimestre')
        nota_lancada = self.request.query_params.get('nota_lancada')
        data_aplicacao = self.request.query_params.get('data_aplicacao')

        if professor:
            queryset = queryset.filter(lecionacao__professor_id=professor)
        if disciplina:
            queryset = queryset.filter(lecionacao__disciplina_id=disciplina)
        if turma:
            queryset = queryset.filter(lecionacao__turma_id=turma)
        if ano_lectivo:
            queryset = queryset.filter(lecionacao__ano_lectivo=ano_lectivo)
        if trimestre:
            queryset = queryset.filter(trimestre=trimestre)
        if nota_lancada in ('true', 'false'):
            queryset = queryset.filter(nota_lancada=nota_lancada == 'true')
        if data_aplicacao:
            queryset = queryset.filter(data_aplicacao=data_aplicacao)

        return queryset

    @action(detail=False, methods=['get'], url_path='lecionacoes')
    def lecionacoes(self, request):
        queryset = Lecionacao.objects.select_related(
            'professor',
            'disciplina',
            'turma',
        ).filter(estado=Lecionacao.Estado.ATIVO)
        serializer = PCTLecionacaoInfoSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='resultados')
    def resultados(self, request, pk=None):
        pct = self.get_object()
        queryset = ResultadoPCT.objects.select_related('aluno__turma', 'pct__lecionacao__professor', 'pct__lecionacao__disciplina', 'pct__lecionacao__turma').filter(pct=pct)
        serializer = ResultadoPCTSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='alunos')
    def alunos(self, request, pk=None):
        pct = self.get_object()
        alunos = Aluno.objects.filter(turma=pct.lecionacao.turma).order_by('numero', 'nome')
        resultados = {
            resultado.aluno_id: resultado
            for resultado in ResultadoPCT.objects.filter(pct=pct)
        }
        data = []
        for aluno in alunos:
            resultado = resultados.get(aluno.id)
            data.append({
                'aluno_id': aluno.id,
                'numero': aluno.numero,
                'nome': aluno.nome,
                'nota': str(resultado.nota) if resultado else '',
                'resultado_id': resultado.id if resultado else None,
            })
        return Response(data)

    @action(detail=True, methods=['post'], url_path='lancar-notas')
    def lancar_notas(self, request, pk=None):
        pct = self.get_object()
        items = request.data.get('resultados', [])
        if not isinstance(items, list):
            return Response({'detail': 'A lista de resultados e obrigatoria.'}, status=status.HTTP_400_BAD_REQUEST)

        saved = []
        errors = []

        with transaction.atomic():
            for index, item in enumerate(items):
                aluno_id = item.get('aluno')
                nota_value = item.get('nota')

                if nota_value in (None, ''):
                    continue

                nota, note_error = parse_note(nota_value)
                if note_error:
                    errors.append({'linha': index + 1, 'detail': 'Nota invalida.'})
                    continue

                aluno = Aluno.objects.filter(id=aluno_id, turma=pct.lecionacao.turma).first()
                if not aluno:
                    errors.append({'linha': index + 1, 'detail': 'Aluno nao encontrado para esta turma.'})
                    continue

                resultado, _created = ResultadoPCT.objects.update_or_create(
                    pct=pct,
                    aluno=aluno,
                    defaults={'nota': nota},
                )
                saved.append(resultado)

            if errors:
                transaction.set_rollback(True)
                return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResultadoPCTSerializer(saved, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='importar-preview', parser_classes=[MultiPartParser, FormParser])
    def importar_preview(self, request, pk=None):
        pct = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'Selecione um ficheiro .xlsx ou .csv.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            preview = preview_pct_results(pct, file_obj)
        except ValueError as error:
            return Response({'detail': str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'contexto': PCTSerializer(pct).data,
            **preview,
        })

    @action(detail=True, methods=['post'], url_path='importar-confirmar')
    def importar_confirmar(self, request, pk=None):
        pct = self.get_object()
        rows = request.data.get('rows', [])
        if not isinstance(rows, list):
            return Response({'detail': 'A lista de linhas importadas e obrigatoria.'}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        saved = []

        with transaction.atomic():
            for row in rows:
                if row.get('status') != 'OK' or row.get('erros'):
                    errors.append({'linha': row.get('linha'), 'detail': 'Linha possui erros de validacao.'})
                    continue

                aluno = Aluno.objects.filter(id=row.get('aluno_id'), turma=pct.lecionacao.turma).first()
                if not aluno:
                    errors.append({'linha': row.get('linha'), 'detail': 'Aluno nao encontrado.'})
                    continue

                nota, note_error = parse_note(row.get('nota'))
                if note_error:
                    errors.append({'linha': row.get('linha'), 'detail': 'Nota invalida.'})
                    continue

                resultado, _created = ResultadoPCT.objects.update_or_create(
                    pct=pct,
                    aluno=aluno,
                    defaults={'nota': nota},
                )
                saved.append(resultado)

            if errors:
                transaction.set_rollback(True)
                return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ResultadoPCTSerializer(saved, many=True)
        return Response(serializer.data)


class ResultadoPCTViewSet(viewsets.ModelViewSet):
    serializer_class = ResultadoPCTSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PCTPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'aluno__nome',
        'pct__lecionacao__professor__nome',
        'pct__lecionacao__disciplina__nome',
        'pct__lecionacao__turma__classe',
        'pct__lecionacao__turma__sala',
        'pct__lecionacao__ano_lectivo',
    ]
    ordering_fields = ['aluno__nome', 'aluno__numero', 'nota', 'created_at']
    ordering = ['aluno__numero', 'aluno__nome']

    def get_queryset(self):
        queryset = ResultadoPCT.objects.select_related(
            'pct__lecionacao__professor',
            'pct__lecionacao__disciplina',
            'pct__lecionacao__turma',
            'aluno__turma',
        ).all()
        pct = self.request.query_params.get('pct')
        aluno = self.request.query_params.get('aluno')

        if pct:
            queryset = queryset.filter(pct_id=pct)
        if aluno:
            queryset = queryset.filter(aluno_id=aluno)

        return queryset
