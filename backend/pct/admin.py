from django.contrib import admin

from .models import PCT, ResultadoPCT


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


@admin.register(ResultadoPCT)
class ResultadoPCTAdmin(admin.ModelAdmin):
    list_display = ('aluno', 'pct', 'professor', 'disciplina', 'turma', 'trimestre', 'nota')
    list_filter = ('pct__trimestre', 'pct__lecionacao__ano_lectivo', 'pct__lecionacao__disciplina')
    search_fields = (
        'aluno__nome',
        'pct__lecionacao__professor__nome',
        'pct__lecionacao__disciplina__nome',
        'pct__lecionacao__turma__classe',
        'pct__lecionacao__turma__sala',
    )
    autocomplete_fields = ('pct', 'aluno')
    ordering = ('pct', 'aluno__numero', 'aluno__nome')

    @admin.display(description='Professor')
    def professor(self, obj):
        return obj.pct.lecionacao.professor

    @admin.display(description='Disciplina')
    def disciplina(self, obj):
        return obj.pct.lecionacao.disciplina

    @admin.display(description='Turma')
    def turma(self, obj):
        return obj.pct.lecionacao.turma

    @admin.display(description='Trimestre')
    def trimestre(self, obj):
        return obj.pct.get_trimestre_display()
