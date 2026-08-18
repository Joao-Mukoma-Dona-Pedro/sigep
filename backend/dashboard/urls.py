from django.urls import path

from .views import DashboardSummaryView

urlpatterns = [
    path('dashboard/resumo/', DashboardSummaryView.as_view(), name='dashboard-resumo'),
]
