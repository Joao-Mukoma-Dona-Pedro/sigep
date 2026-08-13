from django.contrib import admin

from .models import TipoOcorrencia


@admin.register(TipoOcorrencia)
class TipoOcorrenciaAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'categoria', 'created_at')
    list_filter = ('categoria',)
    search_fields = ('descricao',)
    ordering = ('categoria', 'descricao')
