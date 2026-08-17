from rest_framework import serializers

from alunos.models import Aluno
from professores.models import Lecionacao

from .models import PCT, ResultadoPCT


class PCTLecionacaoInfoSerializer(serializers.ModelSerializer):
    professor = serializers.CharField(source='professor.nome', read_only=True)
    professor_id = serializers.IntegerField(source='professor.id', read_only=True)
    disciplina = serializers.CharField(source='disciplina.nome', read_only=True)
    disciplina_id = serializers.IntegerField(source='disciplina.id', read_only=True)
    turma = serializers.SerializerMethodField()
    turma_id = serializers.IntegerField(source='turma.id', read_only=True)
    turma_classe = serializers.CharField(source='turma.classe', read_only=True)
    turma_sala = serializers.CharField(source='turma.sala', read_only=True)

    class Meta:
        model = Lecionacao
        fields = [
            'id',
            'professor_id',
            'professor',
            'disciplina_id',
            'disciplina',
            'turma_id',
            'turma',
            'turma_classe',
            'turma_sala',
            'ano_lectivo',
        ]
        read_only_fields = fields

    def get_turma(self, obj):
        return str(obj.turma)


class PCTSerializer(serializers.ModelSerializer):
    lecionacao = serializers.PrimaryKeyRelatedField(
        queryset=Lecionacao.objects.select_related('professor', 'disciplina', 'turma').all(),
    )
    lecionacao_info = PCTLecionacaoInfoSerializer(source='lecionacao', read_only=True)
    resultados_count = serializers.SerializerMethodField()
    alunos_count = serializers.SerializerMethodField()
    resultados_estado = serializers.SerializerMethodField()

    class Meta:
        model = PCT
        fields = [
            'id',
            'lecionacao',
            'lecionacao_info',
            'trimestre',
            'data_aplicacao',
            'nota_lancada',
            'resultados_count',
            'alunos_count',
            'resultados_estado',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'lecionacao_info',
            'resultados_count',
            'alunos_count',
            'resultados_estado',
            'created_at',
            'updated_at',
        ]

    def validate_observacao(self, value):
        return value.strip() if value else ''

    def get_resultados_count(self, obj):
        return obj.resultados.count()

    def get_alunos_count(self, obj):
        return obj.lecionacao.turma.alunos.count()

    def get_resultados_estado(self, obj):
        resultados_count = self.get_resultados_count(obj)
        alunos_count = self.get_alunos_count(obj)

        if resultados_count == 0:
            return 'NENHUM'
        if alunos_count and resultados_count >= alunos_count:
            return 'COMPLETO'
        return 'PARCIAL'


class ResultadoPCTAlunoInfoSerializer(serializers.ModelSerializer):
    turma = serializers.SerializerMethodField()
    turma_id = serializers.IntegerField(source='turma.id', read_only=True)
    classe = serializers.CharField(source='turma.classe', read_only=True)

    class Meta:
        model = Aluno
        fields = ['id', 'numero', 'nome', 'turma_id', 'turma', 'classe']
        read_only_fields = fields

    def get_turma(self, obj):
        return str(obj.turma)


class ResultadoPCTSerializer(serializers.ModelSerializer):
    pct = serializers.PrimaryKeyRelatedField(
        queryset=PCT.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma').all(),
    )
    aluno = serializers.PrimaryKeyRelatedField(queryset=Aluno.objects.select_related('turma').all())
    aluno_info = ResultadoPCTAlunoInfoSerializer(source='aluno', read_only=True)
    lecionacao_info = PCTLecionacaoInfoSerializer(source='pct.lecionacao', read_only=True)
    trimestre = serializers.CharField(source='pct.trimestre', read_only=True)
    data_aplicacao = serializers.DateField(source='pct.data_aplicacao', read_only=True)

    class Meta:
        model = ResultadoPCT
        fields = [
            'id',
            'pct',
            'aluno',
            'aluno_info',
            'nota',
            'lecionacao_info',
            'trimestre',
            'data_aplicacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'aluno_info', 'lecionacao_info', 'trimestre', 'data_aplicacao', 'created_at', 'updated_at']

    def validate(self, attrs):
        pct = attrs.get('pct', getattr(self.instance, 'pct', None))
        aluno = attrs.get('aluno', getattr(self.instance, 'aluno', None))

        if pct and aluno and aluno.turma_id != pct.lecionacao.turma_id:
            raise serializers.ValidationError({
                'aluno': 'O aluno selecionado nao pertence a turma desta PCT.',
            })

        return attrs
