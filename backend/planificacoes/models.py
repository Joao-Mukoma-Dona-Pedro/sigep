from django.db import models


class Planificacao(models.Model):
    class Trimestre(models.TextChoices):
        PRIMEIRO = '1', '1o Trimestre'
        SEGUNDO = '2', '2o Trimestre'
        TERCEIRO = '3', '3o Trimestre'

    professor = models.ForeignKey(
        'professores.Professor',
        on_delete=models.PROTECT,
        related_name='planificacoes',
    )
    trimestre = models.CharField(max_length=1, choices=Trimestre.choices)
    data_entrega = models.DateField(null=True, blank=True)
    entregou = models.BooleanField(default=False)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data_entrega', 'professor', 'trimestre']
        verbose_name = 'Planificacao'
        verbose_name_plural = 'Planificacoes'

    def __str__(self):
        return f'{self.professor} - {self.get_trimestre_display()}'
