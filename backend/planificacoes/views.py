from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from .models import Planificacao
from .serializers import PlanificacaoSerializer


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
        'professor__nome',
        'professor__email',
        'trimestre',
        'observacao',
    ]
    ordering_fields = ['data_entrega', 'created_at', 'trimestre']
    ordering = ['-data_entrega', 'professor', 'trimestre']

    def get_queryset(self):
        queryset = Planificacao.objects.select_related('professor').all()
        professor = self.request.query_params.get('professor')
        trimestre = self.request.query_params.get('trimestre')
        entregou = self.request.query_params.get('entregou')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if professor:
            queryset = queryset.filter(professor_id=professor)
        if trimestre:
            queryset = queryset.filter(trimestre=trimestre)
        if entregou in ('true', 'false'):
            queryset = queryset.filter(entregou=entregou == 'true')
        if data_inicio:
            queryset = queryset.filter(data_entrega__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_entrega__lte=data_fim)

        return queryset
