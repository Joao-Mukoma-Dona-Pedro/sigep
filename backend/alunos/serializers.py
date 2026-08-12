from rest_framework import serializers

from turmas.models import Turma

from .models import Aluno


class AlunoTurmaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turma
        fields = ['id', 'classe', 'sala']
        read_only_fields = fields


class AlunoSerializer(serializers.ModelSerializer):
    turma = serializers.PrimaryKeyRelatedField(queryset=Turma.objects.all())
    turma_info = AlunoTurmaSerializer(source='turma', read_only=True)

    class Meta:
        model = Aluno
        fields = [
            'id',
            'turma',
            'turma_info',
            'numero',
            'nome',
            'data_nascimento',
            'sexo',
            'encarregado_educacao',
            'telefone_encarregado',
            'estado',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'turma_info', 'created_at', 'updated_at']

    def validate_nome(self, value):
        nome = value.strip()
        if not nome:
            raise serializers.ValidationError('O nome do aluno e obrigatorio.')
        return nome

    def validate_numero(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('O numero do aluno deve ser maior que zero.')
        return value

    def validate_encarregado_educacao(self, value):
        return value.strip() if value else ''

    def validate_telefone_encarregado(self, value):
        return value.strip() if value else ''

    def validate(self, attrs):
        instance = self.instance
        turma = attrs.get('turma', getattr(instance, 'turma', None))
        numero = attrs.get('numero', getattr(instance, 'numero', None))

        if turma and numero is not None:
            queryset = Aluno.objects.filter(turma=turma, numero=numero)
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    'Ja existe um aluno com este numero nesta turma.'
                )

        return attrs
