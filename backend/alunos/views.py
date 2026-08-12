from django.db.models import Q
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated

from .models import Aluno
from .serializers import AlunoSerializer


class AlunoPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AlunoViewSet(viewsets.ModelViewSet):
    serializer_class = AlunoSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = AlunoPagination
    filter_backends = [OrderingFilter]
    ordering_fields = ['nome', 'numero', 'data_nascimento', 'created_at']
    ordering = ['turma', 'numero', 'nome']

    def get_queryset(self):
        queryset = Aluno.objects.select_related('turma').all()
        search = self.request.query_params.get('search')
        turma = self.request.query_params.get('turma')
        classe = self.request.query_params.get('classe')
        estado = self.request.query_params.get('estado')

        if search:
            search_query = (
                Q(nome__icontains=search)
                | Q(turma__classe__icontains=search)
                | Q(turma__sala__icontains=search)
                | Q(encarregado_educacao__icontains=search)
                | Q(estado__icontains=search)
            )
            if search.isdigit():
                search_query |= Q(numero=int(search))
            queryset = queryset.filter(search_query)

        if turma:
            queryset = queryset.filter(turma_id=turma)
        if classe:
            queryset = queryset.filter(turma__classe=classe)
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset
