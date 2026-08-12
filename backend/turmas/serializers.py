import re

from rest_framework import serializers

from professores.models import Professor

from .models import Turma


class DiretorTurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professor
        fields = ['id', 'nome', 'email']
        read_only_fields = fields


class TurmaSerializer(serializers.ModelSerializer):
    diretor_turma = serializers.PrimaryKeyRelatedField(
        queryset=Professor.objects.all(),
        required=False,
        allow_null=True,
    )
    diretor_turma_info = DiretorTurmaSerializer(source='diretor_turma', read_only=True)

    class Meta:
        model = Turma
        fields = [
            'id',
            'classe',
            'sala',
            'periodo',
            'ano_lectivo',
            'turno',
            'capacidade',
            'diretor_turma',
            'diretor_turma_info',
            'estado',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'diretor_turma_info', 'created_at', 'updated_at']

    def validate_classe(self, value):
        classe = value.strip()
        if not classe:
            raise serializers.ValidationError('A classe e obrigatoria.')
        return classe

    def validate_sala(self, value):
        sala = value.strip()
        if not sala:
            raise serializers.ValidationError('A sala e obrigatoria.')
        return sala

    def validate_ano_lectivo(self, value):
        ano_lectivo = value.strip()
        if not ano_lectivo:
            raise serializers.ValidationError('O ano lectivo e obrigatorio.')
        if not re.fullmatch(r'\d{4}(/\d{4})?', ano_lectivo):
            raise serializers.ValidationError('Use um ano lectivo no formato 2026 ou 2026/2027.')
        return ano_lectivo

    def validate_turno(self, value):
        return value.strip() if value else ''

    def validate_capacidade(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('A capacidade deve ser maior que zero.')
        return value

    def validate(self, attrs):
        instance = self.instance
        classe = attrs.get('classe', getattr(instance, 'classe', None))
        sala = attrs.get('sala', getattr(instance, 'sala', None))
        periodo = attrs.get('periodo', getattr(instance, 'periodo', None))
        ano_lectivo = attrs.get('ano_lectivo', getattr(instance, 'ano_lectivo', None))

        if classe and sala and periodo and ano_lectivo:
            queryset = Turma.objects.filter(
                classe=classe,
                sala=sala,
                periodo=periodo,
                ano_lectivo=ano_lectivo,
            )
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    'Ja existe uma turma com esta classe, sala, periodo e ano lectivo.'
                )

        return attrs
