from rest_framework import serializers

from professores.models import Lecionacao

from .models import Planificacao


class PlanificacaoLecionacaoSerializer(serializers.ModelSerializer):
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


class PlanificacaoSerializer(serializers.ModelSerializer):
    lecionacao = serializers.PrimaryKeyRelatedField(
        queryset=Lecionacao.objects.select_related('professor', 'disciplina', 'turma').all(),
    )
    lecionacao_info = PlanificacaoLecionacaoSerializer(source='lecionacao', read_only=True)
    professor = serializers.CharField(source='lecionacao.professor.nome', read_only=True)
    disciplina = serializers.CharField(source='lecionacao.disciplina.nome', read_only=True)
    turma = serializers.SerializerMethodField()
    ano_lectivo = serializers.CharField(source='lecionacao.ano_lectivo', read_only=True)

    class Meta:
        model = Planificacao
        fields = [
            'id',
            'lecionacao',
            'lecionacao_info',
            'professor',
            'disciplina',
            'turma',
            'ano_lectivo',
            'trimestre',
            'data_entrega',
            'entregou',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'lecionacao_info',
            'professor',
            'disciplina',
            'turma',
            'ano_lectivo',
            'created_at',
            'updated_at',
        ]

    def get_turma(self, obj):
        if not obj.lecionacao_id:
            return None
        return str(obj.lecionacao.turma)

    def validate_observacao(self, value):
        return value.strip() if value else ''

    def validate(self, attrs):
        lecionacao = attrs.get('lecionacao', getattr(self.instance, 'lecionacao', None))
        if not lecionacao:
            raise serializers.ValidationError({'lecionacao': 'A leccionacao e obrigatoria.'})
        return attrs
