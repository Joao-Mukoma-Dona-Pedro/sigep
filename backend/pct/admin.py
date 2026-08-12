from django.contrib import admin

from .models import PCT


@admin.register(PCT)
class PCTAdmin(admin.ModelAdmin):
    list_display = (
        'professor',
        'disciplina',
        'turma',
        'ano_lectivo',
        'trimestre',
        'data_aplicacao',
        'nota_lancada',
    )
    list_filter = ('trimestre', 'nota_lancada', 'data_aplicacao', 'lecionacao__ano_lectivo')
    search_fields = (
        'lecionacao__professor__nome',
        'lecionacao__disciplina__nome',
        'lecionacao__turma__classe',
        'lecionacao__turma__sala',
        'observacao',
    )
    autocomplete_fields = ('lecionacao',)
    ordering = ('-data_aplicacao', 'trimestre')

    @admin.display(description='Professor')
    def professor(self, obj):
        return obj.lecionacao.professor

    @admin.display(description='Disciplina')
    def disciplina(self, obj):
        return obj.lecionacao.disciplina

    @admin.display(description='Turma')
    def turma(self, obj):
        return obj.lecionacao.turma

    @admin.display(description='Ano Lectivo')
    def ano_lectivo(self, obj):
        return obj.lecionacao.ano_lectivo
