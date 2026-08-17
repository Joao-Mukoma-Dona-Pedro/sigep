from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from alunos.models import Aluno
from alunos.serializers import AlunoSerializer
from professores.models import Professor
from professores.serializers import ProfessorSerializer
from tipos_ocorrencias.models import TipoOcorrencia
from tipos_ocorrencias.serializers import TipoOcorrenciaSerializer

from .models import Ocorrencia
from .serializers import OcorrenciaSerializer


class OcorrenciaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class OcorrenciaViewSet(viewsets.ModelViewSet):
    serializer_class = OcorrenciaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = OcorrenciaPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'aluno__nome',
        'aluno__turma__classe',
        'aluno__turma__sala',
        'tipo__descricao',
        'tipo__categoria',
        'registada_por__nome',
        'descricao',
        'medida_tomada',
    ]
    ordering_fields = ['data_ocorrencia', 'aluno__nome', 'tipo__descricao', 'registada_por__nome', 'created_at']
    ordering = ['-data_ocorrencia', 'aluno__nome']

    def get_queryset(self):
        queryset = Ocorrencia.objects.select_related(
            'aluno__turma',
            'tipo',
            'registada_por',
        ).all()
        aluno = self.request.query_params.get('aluno')
        turma = self.request.query_params.get('turma')
        tipo = self.request.query_params.get('tipo')
        categoria = self.request.query_params.get('categoria')
        registada_por = self.request.query_params.get('registada_por')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')

        if aluno:
            queryset = queryset.filter(aluno_id=aluno)
        if turma:
            queryset = queryset.filter(aluno__turma_id=turma)
        if tipo:
            queryset = queryset.filter(tipo_id=tipo)
        if categoria:
            queryset = queryset.filter(tipo__categoria=categoria)
        if registada_por:
            queryset = queryset.filter(registada_por_id=registada_por)
        if data_inicio:
            queryset = queryset.filter(data_ocorrencia__gte=data_inicio)
        if data_fim:
            queryset = queryset.filter(data_ocorrencia__lte=data_fim)

        return queryset

    @action(detail=False, methods=['get'], url_path='alunos')
    def alunos(self, request):
        queryset = Aluno.objects.select_related('turma').filter(estado=Aluno.Estado.ATIVO)
        serializer = AlunoSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='tipos')
    def tipos(self, request):
        queryset = TipoOcorrencia.objects.all()
        serializer = TipoOcorrenciaSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='professores')
    def professores(self, request):
        queryset = Professor.objects.filter(estado=Professor.Estado.ATIVO)
        serializer = ProfessorSerializer(queryset, many=True)
        return Response(serializer.data)
