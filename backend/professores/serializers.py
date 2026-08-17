from rest_framework import serializers

from disciplinas.models import Disciplina
from turmas.models import Turma

from .models import Lecionacao, Professor


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


class LecionacaoProfessorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Professor
        fields = ['id', 'nome', 'email']
        read_only_fields = fields


class LecionacaoDisciplinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disciplina
        fields = ['id', 'nome', 'codigo']
        read_only_fields = fields


class LecionacaoTurmaSerializer(serializers.ModelSerializer):
    horario = serializers.SerializerMethodField()

    class Meta:
        model = Turma
        fields = ['id', 'classe', 'sala', 'ano_lectivo', 'horario']
        read_only_fields = fields

    def get_horario(self, obj):
        return 'Horário Regular'


class LecionacaoSerializer(serializers.ModelSerializer):
    professor = serializers.PrimaryKeyRelatedField(queryset=Professor.objects.all())
    disciplina = serializers.PrimaryKeyRelatedField(queryset=Disciplina.objects.all())
    turma = serializers.PrimaryKeyRelatedField(queryset=Turma.objects.all())
    professor_info = LecionacaoProfessorSerializer(source='professor', read_only=True)
    disciplina_info = LecionacaoDisciplinaSerializer(source='disciplina', read_only=True)
    turma_info = LecionacaoTurmaSerializer(source='turma', read_only=True)
    ano_lectivo = serializers.CharField(read_only=True)
    horario = serializers.SerializerMethodField()

    class Meta:
        model = Lecionacao
        fields = [
            'id',
            'professor',
            'professor_info',
            'disciplina',
            'disciplina_info',
            'turma',
            'turma_info',
            'ano_lectivo',
            'horario',
            'estado',
            'observacao',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'professor_info', 'disciplina_info', 'turma_info', 'ano_lectivo', 'horario', 'created_at', 'updated_at']

    def get_horario(self, obj):
        return 'Horário Regular'

    def validate_observacao(self, value):
        return value.strip() if value else ''

    def validate(self, attrs):
        instance = self.instance
        turma = attrs.get('turma', getattr(instance, 'turma', None))
        professor = attrs.get('professor', getattr(instance, 'professor', None))
        disciplina = attrs.get('disciplina', getattr(instance, 'disciplina', None))
        ano_lectivo = turma.ano_lectivo if turma else attrs.get('ano_lectivo', getattr(instance, 'ano_lectivo', None))

        if turma:
            attrs['ano_lectivo'] = turma.ano_lectivo

        if professor and disciplina and turma and ano_lectivo:
            queryset = Lecionacao.objects.filter(
                professor=professor,
                disciplina=disciplina,
                turma=turma,
                ano_lectivo=ano_lectivo,
            )
            if instance:
                queryset = queryset.exclude(pk=instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    'Já existe uma lecionação para este professor, disciplina, turma e ano lectivo.'
                )

        return attrs
