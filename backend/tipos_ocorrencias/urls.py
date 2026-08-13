from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TipoOcorrenciaViewSet

router = DefaultRouter()
router.register('tipos-ocorrencia', TipoOcorrenciaViewSet, basename='tipos-ocorrencia')

urlpatterns = [
    path('', include(router.urls)),
]
