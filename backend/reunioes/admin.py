from django.contrib import admin

from .models import Reuniao


@admin.register(Reuniao)
class ReuniaoAdmin(admin.ModelAdmin):
    list_display = ('data', 'assunto', 'participantes', 'updated_at')
    search_fields = ('assunto', 'participantes', 'decisoes')
    list_filter = ('data',)
    ordering = ('-data', 'assunto')
