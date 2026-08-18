from itertools import chain

from django.db.models import Count
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from alunos.models import Aluno
from aulas.models import ControloAula
from disciplinas.models import Disciplina
from ocorrencias.models import Ocorrencia
from pct.models import PCT
from planificacoes.models import Planificacao
from professores.models import Lecionacao, Professor
from reunioes.models import Reuniao
from turmas.models import Turma


def recent_item(label, text, date):
    return {'label': label, 'text': text, 'date': date}


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = [
            {'label': 'Total de Professores', 'value': Professor.objects.count(), 'icon': 'bi-person-badge', 'tone': 'green'},
            {'label': 'Total de Disciplinas', 'value': Disciplina.objects.count(), 'icon': 'bi-book', 'tone': 'purple'},
            {'label': 'Total de Turmas', 'value': Turma.objects.count(), 'icon': 'bi-grid-3x3-gap', 'tone': 'blue'},
            {'label': 'Total de Alunos', 'value': Aluno.objects.count(), 'icon': 'bi-mortarboard', 'tone': 'cyan'},
            {'label': 'Total de Lecionações', 'value': Lecionacao.objects.count(), 'icon': 'bi-diagram-3', 'tone': 'cyan'},
            {'label': 'Total de PCT', 'value': PCT.objects.count(), 'icon': 'bi-file-earmark-text', 'tone': 'purple'},
            {'label': 'Total de Ocorrências', 'value': Ocorrencia.objects.count(), 'icon': 'bi-exclamation-triangle', 'tone': 'red'},
        ]

        planificacoes_total = Planificacao.objects.count()
        planificacoes_entregues = Planificacao.objects.filter(entregou=True).count()
        aulas_total = ControloAula.objects.count()
        aulas_assistidas = ControloAula.objects.filter(aula_assistida=True).count()
        ocorrencias_por_categoria = list(
            Ocorrencia.objects.values('tipo__categoria')
            .annotate(total=Count('id'))
            .order_by('tipo__categoria')
        )

        activities = sorted(
            chain(
                (
                    recent_item('Professor', f'Professor registado: {item.nome}', item.created_at)
                    for item in Professor.objects.order_by('-created_at')[:3]
                ),
                (
                    recent_item('Aluno', f'Aluno registado: {item.nome}', item.created_at)
                    for item in Aluno.objects.order_by('-created_at')[:3]
                ),
                (
                    recent_item('Turma', f'Turma registada: {item}', item.created_at)
                    for item in Turma.objects.order_by('-created_at')[:3]
                ),
                (
                    recent_item('PCT', f'PCT registada: {item}', item.created_at)
                    for item in PCT.objects.select_related('lecionacao__disciplina', 'lecionacao__turma').order_by('-created_at')[:3]
                ),
                (
                    recent_item('Ocorrência', f'Ocorrência registada: {item.aluno.nome}', item.created_at)
                    for item in Ocorrencia.objects.select_related('aluno').order_by('-created_at')[:3]
                ),
                (
                    recent_item('Reunião', f'Reunião registada: {item.assunto}', item.created_at)
                    for item in Reuniao.objects.order_by('-created_at')[:3]
                ),
            ),
            key=lambda item: item['date'],
            reverse=True,
        )[:8]

        return Response({
            'stats': stats,
            'charts': {
                'planificacoes': {
                    'title': 'Planificações',
                    'total': planificacoes_total,
                    'items': [
                        {'label': 'Entregues', 'value': planificacoes_entregues},
                        {'label': 'Não entregues', 'value': max(planificacoes_total - planificacoes_entregues, 0)},
                    ],
                },
                'aulas': {
                    'title': 'Controlo de Aulas',
                    'total': aulas_total,
                    'items': [
                        {'label': 'Assistidas', 'value': aulas_assistidas},
                        {'label': 'Não assistidas', 'value': max(aulas_total - aulas_assistidas, 0)},
                    ],
                },
                'ocorrencias': {
                    'title': 'Ocorrências por Categoria',
                    'total': sum(item['total'] for item in ocorrencias_por_categoria),
                    'items': [
                        {'label': item['tipo__categoria'] or 'Sem categoria', 'value': item['total']}
                        for item in ocorrencias_por_categoria
                    ],
                },
            },
            'activities': activities,
        })
