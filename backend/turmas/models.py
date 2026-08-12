from django.db import models


class Turma(models.Model):
    class Estado(models.TextChoices):
        ATIVO = 'ATIVO', 'Ativo'
        INATIVO = 'INATIVO', 'Inativo'

    class Periodo(models.TextChoices):
        MANHA = 'MANHA', 'Manha'
        TARDE = 'TARDE', 'Tarde'
        NOITE = 'NOITE', 'Noite'

    classe = models.CharField(max_length=20)
    sala = models.CharField(max_length=30)
    periodo = models.CharField(max_length=20, choices=Periodo.choices)
    ano_lectivo = models.CharField(max_length=20)
    turno = models.CharField(max_length=30, blank=True)
    capacidade = models.PositiveSmallIntegerField(null=True, blank=True)
    diretor_turma = models.ForeignKey(
        'professores.Professor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='turmas_dirigidas',
    )
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ATIVO)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ano_lectivo', 'classe', 'sala', 'periodo']
        verbose_name = 'Turma'
        verbose_name_plural = 'Turmas'
        constraints = [
            models.UniqueConstraint(
                fields=['classe', 'sala', 'periodo', 'ano_lectivo'],
                name='unique_turma_classe_sala_periodo_ano',
            ),
        ]

    def __str__(self):
        return f'{self.classe} {self.sala} - {self.get_periodo_display()} ({self.ano_lectivo})'
