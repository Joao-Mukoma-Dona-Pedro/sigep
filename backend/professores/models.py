from django.db import models


class Professor(models.Model):
    class Estado(models.TextChoices):
        ATIVO = 'ATIVO', 'Ativo'
        INATIVO = 'INATIVO', 'Inativo'

    nome = models.CharField(max_length=150)
    telefone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    data_entrada = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ATIVO)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nome']
        verbose_name = 'Professor'
        verbose_name_plural = 'Professores'

    def __str__(self):
        return self.nome


class Lecionacao(models.Model):
    class Estado(models.TextChoices):
        ATIVO = 'ATIVO', 'Ativo'
        INATIVO = 'INATIVO', 'Inativo'

    professor = models.ForeignKey(
        Professor,
        on_delete=models.CASCADE,
        related_name='lecionacoes',
    )
    disciplina = models.ForeignKey(
        'disciplinas.Disciplina',
        on_delete=models.PROTECT,
        related_name='lecionacoes',
    )
    turma = models.ForeignKey(
        'turmas.Turma',
        on_delete=models.CASCADE,
        related_name='lecionacoes',
    )
    ano_lectivo = models.CharField(max_length=20)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ATIVO)
    observacao = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ano_lectivo', 'turma', 'disciplina', 'professor']
        verbose_name = 'Lecionacao'
        verbose_name_plural = 'Lecionacoes'
        constraints = [
            models.UniqueConstraint(
                fields=['professor', 'disciplina', 'turma', 'ano_lectivo'],
                name='unique_lecionacao_professor_disciplina_turma_ano',
            ),
        ]

    def __str__(self):
        return f'{self.professor} - {self.disciplina} - {self.turma}'
