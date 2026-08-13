from django.db import models


class TipoOcorrencia(models.Model):
    class Categoria(models.TextChoices):
        DISCIPLINAR = 'DISCIPLINAR', 'Disciplinar'
        COMPORTAMENTAL = 'COMPORTAMENTAL', 'Comportamental'
        ACADEMICA = 'ACADEMICA', 'Academica'
        OUTROS = 'OUTROS', 'Outros'

    descricao = models.CharField(max_length=150, unique=True)
    categoria = models.CharField(max_length=20, choices=Categoria.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['categoria', 'descricao']
        verbose_name = 'Tipo de Ocorrencia'
        verbose_name_plural = 'Tipos de Ocorrencias'

    def __str__(self):
        return self.descricao
