from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Professor
from .serializers import ProfessorSerializer


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
