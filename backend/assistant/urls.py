from django.urls import path

from .views import AssistantChatView, AssistantQueryView

urlpatterns = [
    path('assistant/chat/', AssistantChatView.as_view(), name='assistant-chat'),
    path('assistant/query/', AssistantQueryView.as_view(), name='assistant-query'),
]
