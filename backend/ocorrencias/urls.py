from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import OcorrenciaViewSet

router = DefaultRouter()
router.register('ocorrencias', OcorrenciaViewSet, basename='ocorrencias')

urlpatterns = [
    path('', include(router.urls)),
]
