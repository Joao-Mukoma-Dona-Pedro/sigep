from django.contrib import admin

from .models import Aluno


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'numero', 'turma', 'sexo', 'estado', 'encarregado_educacao')
    list_filter = ('estado', 'sexo', 'turma')
    search_fields = ('nome', 'encarregado_educacao', 'telefone_encarregado', 'turma__classe', 'turma__sala')
    autocomplete_fields = ('turma',)
    ordering = ('turma', 'numero', 'nome')
