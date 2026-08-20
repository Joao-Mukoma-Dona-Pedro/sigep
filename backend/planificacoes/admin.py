from django.contrib import admin

from .models import Planificacao


@admin.register(Planificacao)
class PlanificacaoAdmin(admin.ModelAdmin):
    list_display = ('professor', 'disciplina', 'turma', 'ano_lectivo', 'trimestre', 'data_entrega', 'entregou')
    list_filter = ('trimestre', 'entregou', 'data_entrega', 'lecionacao__ano_lectivo')
    search_fields = (
        'lecionacao__professor__nome',
        'lecionacao__professor__email',
        'lecionacao__disciplina__nome',
        'lecionacao__turma__classe',
        'lecionacao__turma__sala',
        'observacao',
    )
    autocomplete_fields = ('lecionacao',)
    ordering = ('-data_entrega', 'lecionacao__professor__nome', 'trimestre')

    def professor(self, obj):
        return obj.lecionacao.professor if obj.lecionacao_id else '-'

    def disciplina(self, obj):
        return obj.lecionacao.disciplina if obj.lecionacao_id else '-'

    def turma(self, obj):
        return obj.lecionacao.turma if obj.lecionacao_id else '-'

    def ano_lectivo(self, obj):
        return obj.lecionacao.ano_lectivo if obj.lecionacao_id else '-'
