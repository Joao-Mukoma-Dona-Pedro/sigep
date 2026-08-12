from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ControloAulaViewSet

router = DefaultRouter()
router.register('controlo-aulas', ControloAulaViewSet, basename='controlo-aulas')

urlpatterns = [
    path('', include(router.urls)),
]
