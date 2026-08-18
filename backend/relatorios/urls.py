from django.urls import path

from .views import (
    AlunosReportView,
    ControloAulasReportView,
    DesempenhoPCTReportView,
    DisciplinasReportView,
    LecionacoesReportView,
    OcorrenciasReportView,
    PCTReportView,
    PlanificacoesReportView,
    ProfessoresReportView,
    ReportOptionsView,
    ReunioesReportView,
    TurmasReportView,
)

urlpatterns = [
    path('relatorios/opcoes/', ReportOptionsView.as_view(), name='relatorios-opcoes'),
    path('relatorios/professores/', ProfessoresReportView.as_view(), name='relatorios-professores'),
    path('relatorios/disciplinas/', DisciplinasReportView.as_view(), name='relatorios-disciplinas'),
    path('relatorios/lecionacoes/', LecionacoesReportView.as_view(), name='relatorios-lecionacoes'),
    path('relatorios/turmas/', TurmasReportView.as_view(), name='relatorios-turmas'),
    path('relatorios/alunos/', AlunosReportView.as_view(), name='relatorios-alunos'),
    path('relatorios/planificacoes/', PlanificacoesReportView.as_view(), name='relatorios-planificacoes'),
    path('relatorios/controlo-aulas/', ControloAulasReportView.as_view(), name='relatorios-controlo-aulas'),
    path('relatorios/pct/', PCTReportView.as_view(), name='relatorios-pct'),
    path('relatorios/desempenho-pct/', DesempenhoPCTReportView.as_view(), name='relatorios-desempenho-pct'),
    path('relatorios/ocorrencias/', OcorrenciasReportView.as_view(), name='relatorios-ocorrencias'),
    path('relatorios/reunioes/', ReunioesReportView.as_view(), name='relatorios-reunioes'),
]
