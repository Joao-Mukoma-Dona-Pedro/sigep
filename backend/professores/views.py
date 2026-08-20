from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from disciplinas.models import Disciplina
from turmas.models import Turma

from .models import Lecionacao, Professor
from .serializers import LecionacaoDisciplinaSerializer, LecionacaoSerializer, LecionacaoTurmaSerializer, ProfessorSerializer


class ProfessorPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ProfessorViewSet(viewsets.ModelViewSet):
    serializer_class = ProfessorSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ProfessorPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome', 'email', 'estado']
    ordering_fields = ['nome', 'data_entrada', 'created_at']
    ordering = ['nome']

    def get_queryset(self):
        queryset = Professor.objects.all()
        estado = self.request.query_params.get('estado')

        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    def destroy(self, request, *args, **kwargs):
        professor = self.get_object()

        if professor.lecionacoes.exists():
            return Response(
                {
                    'detail': (
                        'Este professor possui lecionacoes registadas. '
                        'Remova ou atualize essas relacoes antes de eliminar.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        if professor.turmas_dirigidas.exists():
            return Response(
                {
                    'detail': (
                        'Este professor e diretor de uma ou mais turmas. '
                        'Altere o diretor dessas turmas antes de eliminar.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)


class LecionacaoViewSet(viewsets.ModelViewSet):
    serializer_class = LecionacaoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ProfessorPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'professor__nome',
        'disciplina__nome',
        'turma__classe',
        'turma__sala',
        'ano_lectivo',
        'estado',
    ]
    ordering_fields = ['ano_lectivo', 'professor__nome', 'disciplina__nome', 'turma__classe', 'created_at']
    ordering = ['ano_lectivo', 'turma__classe', 'turma__sala', 'disciplina__nome']

    def get_queryset(self):
        queryset = Lecionacao.objects.select_related('professor', 'disciplina', 'turma').all()
        professor = self.request.query_params.get('professor')
        disciplina = self.request.query_params.get('disciplina')
        turma = self.request.query_params.get('turma')
        classe = self.request.query_params.get('classe')
        ano_lectivo = self.request.query_params.get('ano_lectivo')
        estado = self.request.query_params.get('estado')

        if professor:
            queryset = queryset.filter(professor_id=professor)
        if disciplina:
            queryset = queryset.filter(disciplina_id=disciplina)
        if turma:
            queryset = queryset.filter(turma_id=turma)
        if classe:
            queryset = queryset.filter(turma__classe=classe)
        if ano_lectivo:
            queryset = queryset.filter(ano_lectivo=ano_lectivo)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    def destroy(self, request, *args, **kwargs):
        lecionacao = self.get_object()

        if lecionacao.controlos_aulas.exists():
            return Response(
                {'detail': 'Esta lecionação possui controlo de aulas associado e não pode ser eliminada.'},
                status=status.HTTP_409_CONFLICT,
            )

        if lecionacao.pct.exists():
            return Response(
                {'detail': 'Esta lecionação possui PCT associada e não pode ser eliminada.'},
                status=status.HTTP_409_CONFLICT,
            )

        if lecionacao.planificacoes.exists():
            return Response(
                {'detail': 'Esta lecionação possui planificações associadas e não pode ser eliminada.'},
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='professores')
    def professores(self, request):
        serializer = ProfessorSerializer(Professor.objects.filter(estado=Professor.Estado.ATIVO), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='disciplinas')
    def disciplinas(self, request):
        serializer = LecionacaoDisciplinaSerializer(Disciplina.objects.filter(estado=Disciplina.Estado.ATIVO), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='turmas')
    def turmas(self, request):
        serializer = LecionacaoTurmaSerializer(Turma.objects.filter(estado=Turma.Estado.ATIVO), many=True)
        return Response(serializer.data)
