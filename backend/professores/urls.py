from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProfessorViewSet

router = DefaultRouter()
router.register('professores', ProfessorViewSet, basename='professores')

urlpatterns = [
    path('', include(router.urls)),
]
