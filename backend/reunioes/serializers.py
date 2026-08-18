from rest_framework import serializers

from .models import Reuniao


class ReuniaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reuniao
        fields = [
            'id',
            'data',
            'assunto',
            'participantes',
            'decisoes',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_assunto(self, value):
        assunto = value.strip()
        if not assunto:
            raise serializers.ValidationError('O assunto da reunião é obrigatório.')
        return assunto

    def validate_participantes(self, value):
        return value.strip() if value else ''

    def validate_decisoes(self, value):
        return value.strip() if value else ''

    def validate_observacao(self, value):
        return value.strip() if value else ''
