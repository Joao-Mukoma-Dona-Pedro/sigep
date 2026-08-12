from django.db import models


class Disciplina(models.Model):
    class Estado(models.TextChoices):
        ATIVO = 'ATIVO', 'Ativo'
        INATIVO = 'INATIVO', 'Inativo'

    nome = models.CharField(max_length=120, unique=True)
    codigo = models.CharField(max_length=20, unique=True, null=True, blank=True)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ATIVO)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nome']
        verbose_name = 'Disciplina'
        verbose_name_plural = 'Disciplinas'

    def __str__(self):
        return self.nome
