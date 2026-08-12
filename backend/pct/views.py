from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from professores.models import Lecionacao

from .models import PCT
from .serializers import PCTLecionacaoInfoSerializer, PCTSerializer


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
