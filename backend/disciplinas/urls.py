from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DisciplinaViewSet

router = DefaultRouter()
router.register('disciplinas', DisciplinaViewSet, basename='disciplinas')

urlpatterns = [
    path('', include(router.urls)),
]
