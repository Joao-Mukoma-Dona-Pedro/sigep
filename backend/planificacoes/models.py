from django.db import models


class Planificacao(models.Model):
    class Trimestre(models.TextChoices):
        PRIMEIRO = '1', '1o Trimestre'
        SEGUNDO = '2', '2o Trimestre'
        TERCEIRO = '3', '3o Trimestre'

    lecionacao = models.ForeignKey(
        'professores.Lecionacao',
        on_delete=models.PROTECT,
        related_name='planificacoes',
        null=True,
        blank=True,
    )
    trimestre = models.CharField(max_length=1, choices=Trimestre.choices)
    data_entrega = models.DateField(null=True, blank=True)
    entregou = models.BooleanField(default=False)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data_entrega', 'lecionacao__professor', 'trimestre']
        verbose_name = 'Planificacao'
        verbose_name_plural = 'Planificacoes'

    def __str__(self):
        if self.lecionacao_id:
            return f'{self.lecionacao} - {self.get_trimestre_display()}'
        return f'Planificacao sem lecionacao - {self.get_trimestre_display()}'
