from django.db import models


class Aluno(models.Model):
    class Estado(models.TextChoices):
        ATIVO = 'ATIVO', 'Ativo'
        INATIVO = 'INATIVO', 'Inativo'

    class Sexo(models.TextChoices):
        MASCULINO = 'M', 'Masculino'
        FEMININO = 'F', 'Feminino'

    turma = models.ForeignKey(
        'turmas.Turma',
        on_delete=models.PROTECT,
        related_name='alunos',
    )
    numero = models.PositiveIntegerField(null=True, blank=True)
    nome = models.CharField(max_length=150)
    data_nascimento = models.DateField(null=True, blank=True)
    sexo = models.CharField(max_length=1, choices=Sexo.choices, blank=True)
    encarregado_educacao = models.CharField(max_length=150, blank=True)
    telefone_encarregado = models.CharField(max_length=30, blank=True)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ATIVO)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['turma', 'numero', 'nome']
        verbose_name = 'Aluno'
        verbose_name_plural = 'Alunos'
        constraints = [
            models.UniqueConstraint(
                fields=['turma', 'numero'],
                name='unique_aluno_numero_por_turma',
            ),
        ]

    def __str__(self):
        return self.nome
