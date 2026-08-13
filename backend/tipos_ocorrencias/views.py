from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import TipoOcorrencia
from .serializers import TipoOcorrenciaSerializer


class TipoOcorrenciaPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TipoOcorrenciaViewSet(viewsets.ModelViewSet):
    serializer_class = TipoOcorrenciaSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = TipoOcorrenciaPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['descricao']
    ordering_fields = ['descricao', 'categoria', 'created_at']
    ordering = ['categoria', 'descricao']

    def get_queryset(self):
        queryset = TipoOcorrencia.objects.all()
        categoria = self.request.query_params.get('categoria')

        if categoria:
            queryset = queryset.filter(categoria=categoria)

        return queryset

    def destroy(self, request, *args, **kwargs):
        tipo_ocorrencia = self.get_object()
        ocorrencias = getattr(tipo_ocorrencia, 'ocorrencias', None)

        if ocorrencias is not None and ocorrencias.exists():
            return Response(
                {
                    'detail': (
                        'Este tipo de ocorrencia possui ocorrencias associadas. '
                        'Remova ou atualize essas ocorrencias antes de eliminar.'
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        return super().destroy(request, *args, **kwargs)
