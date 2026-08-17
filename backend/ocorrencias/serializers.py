from rest_framework import serializers

from alunos.models import Aluno
from professores.models import Professor
from tipos_ocorrencias.models import TipoOcorrencia

from .models import Ocorrencia


class OcorrenciaAlunoInfoSerializer(serializers.ModelSerializer):
    turma_id = serializers.IntegerField(source='turma.id', read_only=True)
    turma = serializers.SerializerMethodField()
    classe = serializers.CharField(source='turma.classe', read_only=True)

    class Meta:
        model = Aluno
        fields = ['id', 'nome', 'numero', 'turma_id', 'turma', 'classe']
        read_only_fields = fields

    def get_turma(self, obj):
        return str(obj.turma)


class OcorrenciaTipoInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoOcorrencia
        fields = ['id', 'descricao', 'categoria']
        read_only_fields = fields


class OcorrenciaProfessorInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professor
        fields = ['id', 'nome', 'email']
        read_only_fields = fields


class OcorrenciaSerializer(serializers.ModelSerializer):
    aluno = serializers.PrimaryKeyRelatedField(
        queryset=Aluno.objects.select_related('turma').all(),
    )
    tipo = serializers.PrimaryKeyRelatedField(queryset=TipoOcorrencia.objects.all())
    registada_por = serializers.PrimaryKeyRelatedField(queryset=Professor.objects.all())
    aluno_info = OcorrenciaAlunoInfoSerializer(source='aluno', read_only=True)
    tipo_info = OcorrenciaTipoInfoSerializer(source='tipo', read_only=True)
    registada_por_info = OcorrenciaProfessorInfoSerializer(source='registada_por', read_only=True)

    class Meta:
        model = Ocorrencia
        fields = [
            'id',
            'aluno',
            'aluno_info',
            'tipo',
            'tipo_info',
            'data_ocorrencia',
            'descricao',
            'medida_tomada',
            'registada_por',
            'registada_por_info',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'aluno_info', 'tipo_info', 'registada_por_info', 'created_at', 'updated_at']

    def validate_descricao(self, value):
        descricao = value.strip()
        if not descricao:
            raise serializers.ValidationError('A descricao da ocorrencia e obrigatoria.')
        return descricao

    def validate_medida_tomada(self, value):
        return value.strip() if value else ''

    def validate_observacao(self, value):
        return value.strip() if value else ''
