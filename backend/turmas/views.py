from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Turma
from .serializers import TurmaSerializer


class TurmaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TurmaViewSet(viewsets.ModelViewSet):
    serializer_class = TurmaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TurmaPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = [
        'classe',
        'sala',
        'ano_lectivo',
        'turno',
        'estado',
        'diretor_turma__nome',
        'diretor_turma__email',
    ]
    ordering_fields = ['classe', 'sala', 'ano_lectivo', 'created_at']
    ordering = ['ano_lectivo', 'classe', 'sala', 'periodo']

    def get_queryset(self):
        queryset = Turma.objects.select_related('diretor_turma').all()
        estado = self.request.query_params.get('estado')
        periodo = self.request.query_params.get('periodo')
        ano_lectivo = self.request.query_params.get('ano_lectivo')
        diretor_turma = self.request.query_params.get('diretor_turma')

        if estado:
            queryset = queryset.filter(estado=estado)
        if periodo:
            queryset = queryset.filter(periodo=periodo)
        if ano_lectivo:
            queryset = queryset.filter(ano_lectivo=ano_lectivo)
        if diretor_turma:
            queryset = queryset.filter(diretor_turma_id=diretor_turma)

        return queryset

    def destroy(self, request, *args, **kwargs):
        turma = self.get_object()

        if turma.alunos.exists():
            return Response(
                {
                    'detail': (
                        'Esta turma possui alunos associados. '
                        'Remova ou transfira esses alunos antes de eliminar.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        if turma.lecionacoes.exists():
            return Response(
                {
                    'detail': (
                        'Esta turma possui lecionacoes registadas. '
                        'Remova ou atualize essas relacoes antes de eliminar.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)
