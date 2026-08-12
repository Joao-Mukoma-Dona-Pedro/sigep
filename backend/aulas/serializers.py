from rest_framework import serializers

from professores.models import Lecionacao

from .models import ControloAula


class LecionacaoInfoSerializer(serializers.ModelSerializer):
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


class ControloAulaSerializer(serializers.ModelSerializer):
    lecionacao = serializers.PrimaryKeyRelatedField(
        queryset=Lecionacao.objects.select_related('professor', 'disciplina', 'turma').all(),
    )
    lecionacao_info = LecionacaoInfoSerializer(source='lecionacao', read_only=True)

    class Meta:
        model = ControloAula
        fields = [
            'id',
            'lecionacao',
            'lecionacao_info',
            'data',
            'aula_assistida',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'lecionacao_info', 'created_at', 'updated_at']

    def validate_observacao(self, value):
        return value.strip() if value else ''
