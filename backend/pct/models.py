from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class PCT(models.Model):
    class Trimestre(models.TextChoices):
        PRIMEIRO = '1', '1o Trimestre'
        SEGUNDO = '2', '2o Trimestre'
        TERCEIRO = '3', '3o Trimestre'

    lecionacao = models.ForeignKey(
        'professores.Lecionacao',
        on_delete=models.PROTECT,
        related_name='pct',
    )
    trimestre = models.CharField(max_length=1, choices=Trimestre.choices)
    data_aplicacao = models.DateField()
    nota_lancada = models.BooleanField(default=False)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data_aplicacao', 'trimestre', 'lecionacao']
        verbose_name = 'PCT'
        verbose_name_plural = 'PCT'
        constraints = [
            models.UniqueConstraint(
                fields=['lecionacao', 'trimestre'],
                name='unique_pct_lecionacao_trimestre',
            ),
        ]

    def __str__(self):
        return f'{self.lecionacao} - {self.get_trimestre_display()}'


class ResultadoPCT(models.Model):
    pct = models.ForeignKey(
        PCT,
        on_delete=models.PROTECT,
        related_name='resultados',
    )
    aluno = models.ForeignKey(
        'alunos.Aluno',
        on_delete=models.PROTECT,
        related_name='resultados_pct',
    )
    nota = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0), MaxValueValidator(20)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['aluno__numero', 'aluno__nome']
        verbose_name = 'Resultado PCT'
        verbose_name_plural = 'Resultados PCT'
        constraints = [
            models.UniqueConstraint(
                fields=['pct', 'aluno'],
                name='unique_resultado_pct_aluno',
            ),
        ]

    def __str__(self):
        return f'{self.pct} - {self.aluno}: {self.nota}'
