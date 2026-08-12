from rest_framework import serializers

from professores.models import Professor

from .models import Planificacao


class PlanificacaoProfessorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professor
        fields = ['id', 'nome', 'email']
        read_only_fields = fields


class PlanificacaoSerializer(serializers.ModelSerializer):
    professor = serializers.PrimaryKeyRelatedField(queryset=Professor.objects.all())
    professor_info = PlanificacaoProfessorSerializer(source='professor', read_only=True)

    class Meta:
        model = Planificacao
        fields = [
            'id',
            'professor',
            'professor_info',
            'trimestre',
            'data_entrega',
            'entregou',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'professor_info', 'created_at', 'updated_at']

    def validate_observacao(self, value):
        return value.strip() if value else ''
