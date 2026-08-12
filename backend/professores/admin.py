from django.contrib import admin

from .models import Lecionacao, Professor


class LecionacaoInline(admin.TabularInline):
    model = Lecionacao
    extra = 0


@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'telefone', 'email', 'estado', 'data_entrada')
    list_filter = ('estado',)
    search_fields = ('nome', 'telefone', 'email')
    inlines = (LecionacaoInline,)
    ordering = ('nome',)


@admin.register(Lecionacao)
class LecionacaoAdmin(admin.ModelAdmin):
    list_display = ('professor', 'disciplina', 'turma', 'ano_lectivo', 'estado')
    list_filter = ('estado', 'ano_lectivo', 'disciplina', 'turma')
    search_fields = ('professor__nome', 'disciplina__nome', 'turma__classe', 'turma__sala')
    autocomplete_fields = ('professor', 'disciplina', 'turma')
