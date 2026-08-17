from django.db import models


class Ocorrencia(models.Model):
    aluno = models.ForeignKey(
        'alunos.Aluno',
        on_delete=models.PROTECT,
        related_name='ocorrencias',
    )
    tipo = models.ForeignKey(
        'tipos_ocorrencias.TipoOcorrencia',
        on_delete=models.PROTECT,
        related_name='ocorrencias',
    )
    data_ocorrencia = models.DateField()
    descricao = models.TextField()
    medida_tomada = models.TextField(blank=True)
    registada_por = models.ForeignKey(
        'professores.Professor',
        on_delete=models.PROTECT,
        related_name='ocorrencias_registadas',
    )
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-data_ocorrencia', 'aluno']
        verbose_name = 'Ocorrencia'
        verbose_name_plural = 'Ocorrencias'

    def __str__(self):
        return f'{self.aluno} - {self.tipo} ({self.data_ocorrencia})'
