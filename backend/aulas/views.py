from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from professores.models import Lecionacao

from .models import ControloAula
from .serializers import ControloAulaSerializer, LecionacaoInfoSerializer


class ControloAulaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ControloAulaViewSet(viewsets.ModelViewSet):
    serializer_class = ControloAulaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ControloAulaPagination
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
        'data',
        'lecionacao__professor__nome',
        'lecionacao__turma__classe',
        'lecionacao__disciplina__nome',
    ]
    ordering = ['-data', 'lecionacao__professor__nome']

    def get_queryset(self):
        queryset = ControloAula.objects.select_related(
            'lecionacao__professor',
            'lecionacao__disciplina',
            'lecionacao__turma',
        ).all()
        professor = self.request.query_params.get('professor')
        disciplina = self.request.query_params.get('disciplina')
        turma = self.request.query_params.get('turma')
        ano_lectivo = self.request.query_params.get('ano_lectivo')
        data = self.request.query_params.get('data')
        aula_assistida = self.request.query_params.get('aula_assistida')

        if professor:
            queryset = queryset.filter(lecionacao__professor_id=professor)
        if disciplina:
            queryset = queryset.filter(lecionacao__disciplina_id=disciplina)
        if turma:
            queryset = queryset.filter(lecionacao__turma_id=turma)
        if ano_lectivo:
            queryset = queryset.filter(lecionacao__ano_lectivo=ano_lectivo)
        if data:
            queryset = queryset.filter(data=data)
        if aula_assistida in ('true', 'false'):
            queryset = queryset.filter(aula_assistida=aula_assistida == 'true')

        return queryset

    @action(detail=False, methods=['get'], url_path='lecionacoes')
    def lecionacoes(self, request):
        queryset = Lecionacao.objects.select_related(
            'professor',
            'disciplina',
            'turma',
        ).filter(estado=Lecionacao.Estado.ATIVO)
        serializer = LecionacaoInfoSerializer(queryset, many=True)
        return Response(serializer.data)
