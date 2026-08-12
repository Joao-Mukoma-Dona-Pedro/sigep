from django.contrib import admin

from .models import Planificacao


@admin.register(Planificacao)
class PlanificacaoAdmin(admin.ModelAdmin):
    list_display = ('professor', 'trimestre', 'data_entrega', 'entregou')
    list_filter = ('trimestre', 'entregou', 'data_entrega')
    search_fields = ('professor__nome', 'professor__email', 'observacao')
    autocomplete_fields = ('professor',)
    ordering = ('-data_entrega', 'professor', 'trimestre')
