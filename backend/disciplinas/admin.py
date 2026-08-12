from django.contrib import admin

from .models import Disciplina


@admin.register(Disciplina)
class DisciplinaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'codigo', 'estado', 'updated_at')
    list_filter = ('estado',)
    search_fields = ('nome', 'codigo')
    ordering = ('nome',)
