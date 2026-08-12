from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PCTViewSet

router = DefaultRouter()
router.register('pct', PCTViewSet, basename='pct')

urlpatterns = [
    path('', include(router.urls)),
]
