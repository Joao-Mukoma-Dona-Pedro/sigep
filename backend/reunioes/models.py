from django.db import models


class Reuniao(models.Model):
    data = models.DateField()
    assunto = models.CharField(max_length=180)
    participantes = models.TextField(blank=True)
    decisoes = models.TextField(blank=True)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data', 'assunto']
        verbose_name = 'Reunião'
        verbose_name_plural = 'Reuniões'

    def __str__(self):
        return f'{self.data} - {self.assunto}'
