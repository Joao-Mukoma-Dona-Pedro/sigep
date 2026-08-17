from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .analysis_views import (
    PCTAnoLectivoAnalysisView,
    PCTClasseAnalysisView,
    PCTIndividualAnalysisView,
    PCTTurmaAnalysisView,
)
from .views import PCTViewSet, ResultadoPCTViewSet

router = DefaultRouter()
router.register('pct', PCTViewSet, basename='pct')
router.register('pct-resultados', ResultadoPCTViewSet, basename='pct-resultados')

urlpatterns = [
    path('', include(router.urls)),
    path('pct-analises/individual/', PCTIndividualAnalysisView.as_view(), name='pct-analise-individual'),
    path('pct-analises/turma/', PCTTurmaAnalysisView.as_view(), name='pct-analise-turma'),
    path('pct-analises/classe/', PCTClasseAnalysisView.as_view(), name='pct-analise-classe'),
    path('pct-analises/ano-lectivo/', PCTAnoLectivoAnalysisView.as_view(), name='pct-analise-ano-lectivo'),
]
