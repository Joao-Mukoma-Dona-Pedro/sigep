from django.contrib import admin

from .models import Ocorrencia


@admin.register(Ocorrencia)
class OcorrenciaAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'tipo', 'data_ocorrencia', 'registada_por')
    list_filter = ('tipo', 'tipo__categoria', 'data_ocorrencia', 'registada_por')
    search_fields = ('aluno__nome', 'descricao')
    autocomplete_fields = ('aluno', 'tipo', 'registada_por')
    ordering = ('-data_ocorrencia', 'aluno__nome')
