from rest_framework import serializers

from .models import TipoOcorrencia


class TipoOcorrenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoOcorrencia
        fields = [
            'id',
            'descricao',
            'categoria',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_descricao(self, value):
        descricao = value.strip()
        if not descricao:
            raise serializers.ValidationError('A descricao do tipo de ocorrencia e obrigatoria.')
        return descricao
