from rest_framework import serializers

from .models import Professor


class ProfessorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Professor
        fields = [
            'id',
            'nome',
            'telefone',
            'email',
            'data_entrada',
            'estado',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_nome(self, value):
        nome = value.strip()
        if not nome:
            raise serializers.ValidationError('O nome do professor e obrigatorio.')
        return nome

    def validate_email(self, value):
        if value in ('', None):
            return None
        return value.strip().lower()

    def validate_telefone(self, value):
        return value.strip() if value else ''
