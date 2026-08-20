from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from professores.models import Lecionacao
from .models import Planificacao
from .serializers import PlanificacaoLecionacaoSerializer, PlanificacaoSerializer


class PlanificacaoPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class PlanificacaoViewSet(viewsets.ModelViewSet):
    serializer_class = PlanificacaoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PlanificacaoPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'lecionacao__professor__nome',
        'lecionacao__professor__email',
        'lecionacao__disciplina__nome',
        'lecionacao__turma__classe',
        'lecionacao__turma__sala',
        'lecionacao__ano_lectivo',
        'trimestre',
        'observacao',
    ]
    ordering_fields = [
        'data_entrega',
        'created_at',
        'trimestre',
        'lecionacao__professor__nome',
        'lecionacao__disciplina__nome',
        'lecionacao__turma__classe',
    ]
    ordering = ['-data_entrega', 'lecionacao__professor__nome', 'trimestre']

    def get_queryset(self):
        queryset = Planificacao.objects.select_related(
            'lecionacao__professor',
            'lecionacao__disciplina',
            'lecionacao__turma',
        ).all()
        professor = self.request.query_params.get('professor')
        disciplina = self.request.query_params.get('disciplina')
        turma = self.request.query_params.get('turma')
        ano_lectivo = self.request.query_params.get('ano_lectivo')
        trimestre = self.request.query_params.get('trimestre')
        entregou = self.request.query_params.get('entregou')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

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
        if entregou in ('true', 'false'):
            queryset = queryset.filter(entregou=entregou == 'true')
        if data_inicio:
            queryset = queryset.filter(data_entrega__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_entrega__lte=data_fim)

        return queryset

    @action(detail=False, methods=['get'], url_path='lecionacoes')
    def lecionacoes(self, request):
        queryset = Lecionacao.objects.select_related('professor', 'disciplina', 'turma').order_by(
            'ano_lectivo',
            'turma__classe',
            'turma__sala',
            'disciplina__nome',
            'professor__nome',
        )
        serializer = PlanificacaoLecionacaoSerializer(queryset, many=True)
        return Response(serializer.data)
