from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from .models import Reuniao
from .serializers import ReuniaoSerializer


class ReuniaoPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class ReuniaoViewSet(viewsets.ModelViewSet):
    serializer_class = ReuniaoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = ReuniaoPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['assunto', 'participantes', 'decisoes']
    ordering_fields = ['data', 'created_at', 'assunto']
    ordering = ['-data', 'assunto']

    def get_queryset(self):
        queryset = Reuniao.objects.all()
        data = self.request.query_params.get('data')

        if data:
            queryset = queryset.filter(data=data)

        return queryset
