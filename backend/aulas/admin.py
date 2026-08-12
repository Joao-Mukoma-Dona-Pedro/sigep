from django.contrib import admin

from .models import ControloAula


@admin.register(ControloAula)
class ControloAulaAdmin(admin.ModelAdmin):
    list_display = (
        'professor',
        'disciplina',
        'turma',
        'data',
        'aula_assistida',
    )
    list_filter = ('aula_assistida', 'data', 'lecionacao__ano_lectivo')
    search_fields = (
        'lecionacao__professor__nome',
        'lecionacao__disciplina__nome',
        'lecionacao__turma__classe',
        'lecionacao__turma__sala',
        'observacao',
    )
    autocomplete_fields = ('lecionacao',)
    ordering = ('-data', 'lecionacao__professor__nome')

    @admin.display(description='Professor')
    def professor(self, obj):
        return obj.lecionacao.professor

    @admin.display(description='Disciplina')
    def disciplina(self, obj):
        return obj.lecionacao.disciplina

    @admin.display(description='Turma')
    def turma(self, obj):
        return obj.lecionacao.turma
