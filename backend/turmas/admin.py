from django.contrib import admin

from .models import Turma


@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ('classe', 'sala', 'periodo', 'ano_lectivo', 'diretor_turma', 'estado')
    list_filter = ('estado', 'periodo', 'ano_lectivo', 'classe')
    search_fields = ('classe', 'sala', 'ano_lectivo', 'diretor_turma__nome')
    autocomplete_fields = ('diretor_turma',)
    ordering = ('ano_lectivo', 'classe', 'sala', 'periodo')
