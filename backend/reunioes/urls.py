from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReuniaoViewSet

router = DefaultRouter()
router.register('reunioes', ReuniaoViewSet, basename='reunioes')

urlpatterns = [
    path('', include(router.urls)),
]
