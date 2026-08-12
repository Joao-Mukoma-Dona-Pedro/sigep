from django.db import models


class ControloAula(models.Model):
    lecionacao = models.ForeignKey(
        'professores.Lecionacao',
        on_delete=models.PROTECT,
        related_name='controlos_aulas',
    )
    data = models.DateField()
    aula_assistida = models.BooleanField(default=False)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data', 'lecionacao']
        verbose_name = 'Controlo de Aula'
        verbose_name_plural = 'Controlo de Aulas'

    def __str__(self):
        return f'{self.lecionacao} - {self.data}'
