from rest_framework import serializers

from .models import Disciplina


class DisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = [
            'id',
            'nome',
            'codigo',
            'estado',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_nome(self, value):
        nome = value.strip()
        if not nome:
            raise serializers.ValidationError('O nome da disciplina é obrigatório.')

        queryset = Disciplina.objects.filter(nome__iexact=nome)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Já existe uma disciplina com este nome.')

        return nome

    def validate_codigo(self, value):
        if value in ('', None):
            return None

        codigo = value.strip().upper()
        if not codigo:
            return None

        queryset = Disciplina.objects.filter(codigo__iexact=codigo)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Já existe uma disciplina com este código.')

        return codigo

    def validate_observacao(self, value):
        return value.strip() if value else ''
