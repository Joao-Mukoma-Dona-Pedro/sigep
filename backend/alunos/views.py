import csv
import io

from django.db.models import Q
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from .models import Aluno
from .serializers import AlunoSerializer
from .importers import SpreadsheetError, analyse_upload, confirm_upload


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

    def _import_params(self, request):
        upload = request.FILES.get('ficheiro')
        if not upload:
            raise SpreadsheetError('Seleccione um ficheiro CSV ou XLSX.')
        mode = request.data.get('modo', 'importar')
        if mode not in {'importar', 'actualizar'}:
            raise SpreadsheetError('Modo de importação inválido.')
        return upload, request.data.get('turma'), mode

    @action(detail=False, methods=['post'], url_path='importar/preview', parser_classes=[MultiPartParser, FormParser])
    def import_preview(self, request):
        try:
            result = analyse_upload(*self._import_params(request))
            result.pop('_turma', None)
            return Response(result)
        except SpreadsheetError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='importar/confirmar', parser_classes=[MultiPartParser, FormParser])
    def import_confirm(self, request):
        try:
            return Response(confirm_upload(*self._import_params(request)), status=status.HTTP_201_CREATED)
        except SpreadsheetError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='importar/modelo')
    def import_template(self, request):
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow(['Número do aluno', 'Nome completo', 'Nome do encarregado (opcional)', 'Contacto do encarregado (opcional)'])
        writer.writerow(['001', 'João Manuel Pedro', 'Maria Pedro', '923000000'])
        response = HttpResponse('\ufeff' + output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="modelo_alunos.csv"'
        return response

    @action(detail=False, methods=['get'], url_path='exportar')
    def export_students(self, request):
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        writer.writerow(['Número do aluno', 'Nome completo', 'Nome do encarregado', 'Contacto do encarregado', 'Turma', 'Classe', 'Ano lectivo', 'Estado'])
        for aluno in self.filter_queryset(self.get_queryset()):
            writer.writerow([aluno.numero or '', aluno.nome, aluno.encarregado_educacao, aluno.telefone_encarregado, str(aluno.turma), aluno.turma.classe, aluno.turma.ano_lectivo, aluno.get_estado_display()])
        response = HttpResponse('\ufeff' + output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="alunos.csv"'
        return response
