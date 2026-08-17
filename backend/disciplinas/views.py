from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Disciplina
from .serializers import DisciplinaSerializer


class DisciplinaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DisciplinaViewSet(viewsets.ModelViewSet):
    serializer_class = DisciplinaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DisciplinaPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nome', 'codigo', 'estado']
    ordering_fields = ['nome', 'codigo', 'created_at']
    ordering = ['nome']

    def get_queryset(self):
        queryset = Disciplina.objects.all()
        estado = self.request.query_params.get('estado')

        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    def destroy(self, request, *args, **kwargs):
        disciplina = self.get_object()

        if disciplina.lecionacoes.exists():
            return Response(
                {
                    'detail': (
                        'Esta disciplina não pode ser eliminada porque está '
                        'associada a uma ou mais lecionações.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)
