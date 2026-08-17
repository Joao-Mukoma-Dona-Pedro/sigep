from collections import defaultdict
from decimal import Decimal

from django.db.models import Avg, Count, Max, Min, Q, Sum
from rest_framework.exceptions import ValidationError

from alunos.models import Aluno
from disciplinas.models import Disciplina
from turmas.models import Turma

from .models import PCT, ResultadoPCT


def decimal_to_float(value):
    return float(value) if value is not None else None


def pct_label(trimestre):
    labels = {'1': 'PCT1', '2': 'PCT2', '3': 'PCT3'}
    return labels.get(str(trimestre), f'PCT{trimestre}')


def stats(queryset):
    aggregate = queryset.aggregate(
        total=Count('id'),
        soma=Sum('nota'),
        media=Avg('nota'),
        maior_nota=Max('nota'),
        menor_nota=Min('nota'),
    )
    return {
        'media': decimal_to_float(aggregate['media']),
        'maior_nota': decimal_to_float(aggregate['maior_nota']),
        'menor_nota': decimal_to_float(aggregate['menor_nota']),
        'quantidade_resultados': aggregate['total'] or 0,
        'soma': aggregate['soma'] or Decimal('0'),
    }


def base_resultados():
    return ResultadoPCT.objects.select_related(
        'aluno__turma',
        'pct__lecionacao__professor',
        'pct__lecionacao__disciplina',
        'pct__lecionacao__turma',
    )


def filter_resultados(params, *, require_year=True):
    ano_lectivo = params.get('ano_lectivo')
    if require_year and not ano_lectivo:
        raise ValidationError({'ano_lectivo': 'O ano lectivo e obrigatorio.'})

    queryset = base_resultados()
    if ano_lectivo:
        queryset = queryset.filter(pct__lecionacao__ano_lectivo=ano_lectivo)

    pct_id = params.get('pct')
    trimestre = params.get('trimestre')
    classe = params.get('classe')
    turma = params.get('turma')
    disciplina = params.get('disciplina')
    aluno = params.get('aluno')

    pct_obj = None
    if pct_id:
        pct_obj = PCT.objects.select_related('lecionacao__turma', 'lecionacao__disciplina').filter(id=pct_id).first()
        if not pct_obj:
            raise ValidationError({'pct': 'PCT nao encontrada.'})
        if ano_lectivo and pct_obj.lecionacao.ano_lectivo != ano_lectivo:
            raise ValidationError({'pct': 'A PCT selecionada nao pertence ao ano lectivo informado.'})
        if trimestre and pct_obj.trimestre != trimestre:
            raise ValidationError({'pct': 'A PCT selecionada nao pertence ao trimestre informado.'})
        if classe and pct_obj.lecionacao.turma.classe != classe:
            raise ValidationError({'pct': 'A PCT selecionada nao pertence a classe informada.'})
        if turma and pct_obj.lecionacao.turma_id != int(turma):
            raise ValidationError({'pct': 'A PCT selecionada nao pertence a turma informada.'})
        if disciplina and pct_obj.lecionacao.disciplina_id != int(disciplina):
            raise ValidationError({'pct': 'A PCT selecionada nao pertence a disciplina informada.'})
        queryset = queryset.filter(pct=pct_obj)

    if trimestre:
        queryset = queryset.filter(pct__trimestre=trimestre)
    if classe:
        queryset = queryset.filter(pct__lecionacao__turma__classe=classe)
    if turma:
        turma_obj = Turma.objects.filter(id=turma).first()
        if not turma_obj:
            raise ValidationError({'turma': 'Turma nao encontrada.'})
        if classe and turma_obj.classe != classe:
            raise ValidationError({'turma': 'A turma selecionada nao pertence a classe informada.'})
        if ano_lectivo and turma_obj.ano_lectivo != ano_lectivo:
            raise ValidationError({'turma': 'A turma selecionada nao pertence ao ano lectivo informado.'})
        queryset = queryset.filter(pct__lecionacao__turma_id=turma)
    if disciplina:
        if not Disciplina.objects.filter(id=disciplina).exists():
            raise ValidationError({'disciplina': 'Disciplina nao encontrada.'})
        queryset = queryset.filter(pct__lecionacao__disciplina_id=disciplina)
    if aluno:
        aluno_obj = Aluno.objects.select_related('turma').filter(id=aluno).first()
        if not aluno_obj:
            raise ValidationError({'aluno': 'Aluno nao encontrado.'})
        if turma and aluno_obj.turma_id != int(turma):
            raise ValidationError({'aluno': 'O aluno selecionado nao pertence a turma informada.'})
        queryset = queryset.filter(aluno_id=aluno)

    return queryset, pct_obj


def pcts_queryset(params):
    queryset = PCT.objects.select_related('lecionacao__turma', 'lecionacao__disciplina')
    ano_lectivo = params.get('ano_lectivo')
    if ano_lectivo:
        queryset = queryset.filter(lecionacao__ano_lectivo=ano_lectivo)
    if params.get('pct'):
        queryset = queryset.filter(id=params.get('pct'))
    if params.get('trimestre'):
        queryset = queryset.filter(trimestre=params.get('trimestre'))
    if params.get('classe'):
        queryset = queryset.filter(lecionacao__turma__classe=params.get('classe'))
    if params.get('turma'):
        queryset = queryset.filter(lecionacao__turma_id=params.get('turma'))
    if params.get('disciplina'):
        queryset = queryset.filter(lecionacao__disciplina_id=params.get('disciplina'))
    return queryset


def build_differences(values_by_trimestre):
    def diff(current, previous):
        if current is None or previous is None:
            return None
        return round(current - previous, 2)

    first = values_by_trimestre.get('1')
    second = values_by_trimestre.get('2')
    third = values_by_trimestre.get('3')
    return {
        'PCT2-PCT1': diff(second, first),
        'PCT3-PCT2': diff(third, second),
        'PCT3-PCT1': diff(third, first),
    }


def evolution_from_rows(rows, value_key='nota'):
    evolution = []
    previous = None
    for row in rows:
        value = row.get(value_key)
        difference = None if previous is None or value is None else round(value - previous, 2)
        evolution.append({**row, 'diferenca_anterior': difference})
        if value is not None:
            previous = value
    return evolution


def incomplete_warning(resultados_count, expected_count):
    if expected_count == 0:
        return 'Nao existem alunos/PCT suficientes para calcular a cobertura.'
    if resultados_count == 0:
        return 'Nao existem resultados lancados para os filtros selecionados.'
    if resultados_count < expected_count:
        return f'{resultados_count} resultados lancados de {expected_count} esperados.'
    return ''


def individual_analysis(params):
    if not params.get('aluno'):
        raise ValidationError({'aluno': 'O aluno e obrigatorio.'})
    queryset, _pct = filter_resultados(params)
    aluno = Aluno.objects.select_related('turma').get(id=params.get('aluno'))
    rows = []
    values_by_trimestre = {}

    for resultado in queryset.order_by('pct__trimestre', 'pct__data_aplicacao', 'pct__lecionacao__disciplina__nome'):
        nota = decimal_to_float(resultado.nota)
        trimestre = resultado.pct.trimestre
        rows.append({
            'pct': resultado.pct_id,
            'trimestre': trimestre,
            'trimestre_label': pct_label(trimestre),
            'data_aplicacao': resultado.pct.data_aplicacao,
            'disciplina': resultado.pct.lecionacao.disciplina.nome,
            'turma': str(resultado.pct.lecionacao.turma),
            'classe': resultado.pct.lecionacao.turma.classe,
            'nota': nota,
        })
        values_by_trimestre.setdefault(trimestre, nota)

    summary = stats(queryset)
    return {
        'filtros': dict(params),
        'aluno': {'id': aluno.id, 'numero': aluno.numero, 'nome': aluno.nome},
        'turma': str(aluno.turma),
        'classe': aluno.turma.classe,
        'ano_lectivo': params.get('ano_lectivo'),
        'disciplina': params.get('disciplina') or None,
        'resumo': {key: value for key, value in summary.items() if key != 'soma'},
        'evolucao': evolution_from_rows(rows),
        'diferencas': build_differences(values_by_trimestre),
        'tabela': rows,
        'avisos': [] if rows else ['Nao existem resultados para os filtros selecionados.'],
    }


def turma_analysis(params):
    for field in ('ano_lectivo', 'classe', 'turma'):
        if not params.get(field):
            raise ValidationError({field: f'O campo {field} e obrigatorio.'})

    queryset, _pct = filter_resultados(params)
    turma = Turma.objects.get(id=params.get('turma'))
    alunos = Aluno.objects.filter(turma=turma).order_by('numero', 'nome')
    pcts = list(pcts_queryset(params))
    expected_count = alunos.count() * len(pcts)
    summary = stats(queryset)
    result_by_student = defaultdict(list)
    for resultado in queryset:
        result_by_student[resultado.aluno_id].append(resultado)

    table = []
    for aluno in alunos:
        notas = result_by_student.get(aluno.id, [])
        notas_values = [decimal_to_float(item.nota) for item in notas]
        table.append({
            'aluno': {'id': aluno.id, 'numero': aluno.numero, 'nome': aluno.nome},
            'notas': [
                {
                    'pct': item.pct_id,
                    'trimestre': item.pct.trimestre,
                    'disciplina': item.pct.lecionacao.disciplina.nome,
                    'nota': decimal_to_float(item.nota),
                }
                for item in sorted(notas, key=lambda item: (item.pct.trimestre, item.pct.data_aplicacao))
            ],
            'media': round(sum(notas_values) / len(notas_values), 2) if notas_values else None,
            'situacao': 'com resultado' if notas_values else 'sem resultado',
        })

    evolution_rows = []
    values_by_trimestre = {}
    for item in queryset.values('pct__trimestre').annotate(media=Avg('nota')).order_by('pct__trimestre'):
        value = decimal_to_float(item['media'])
        values_by_trimestre[item['pct__trimestre']] = value
        evolution_rows.append({'trimestre': item['pct__trimestre'], 'trimestre_label': pct_label(item['pct__trimestre']), 'media': value})

    distribution = []
    for lower, upper, label in [(0, 4.99, '0-4.99'), (5, 9.99, '5-9.99'), (10, 13.99, '10-13.99'), (14, 17.99, '14-17.99'), (18, None, '18+')]:
        condition = Q(nota__gte=lower)
        if upper is not None:
            condition &= Q(nota__lte=upper)
        distribution.append({'faixa': label, 'quantidade': queryset.filter(condition).count()})

    resultados_count = summary['quantidade_resultados']
    return {
        'filtros': dict(params),
        'turma': {'id': turma.id, 'nome': str(turma), 'sala': turma.sala},
        'classe': turma.classe,
        'ano_lectivo': params.get('ano_lectivo'),
        'disciplina': params.get('disciplina') or None,
        'resumo': {
            **{key: value for key, value in summary.items() if key != 'soma'},
            'alunos_esperados': alunos.count(),
            'alunos_com_resultado': len(result_by_student),
            'alunos_sem_resultado': max(alunos.count() - len(result_by_student), 0),
            'resultados_esperados': expected_count,
            'percentual_lancamento': round((resultados_count / expected_count) * 100, 2) if expected_count else 0,
        },
        'evolucao_media': evolution_from_rows(evolution_rows, value_key='media'),
        'diferencas': build_differences(values_by_trimestre),
        'distribuicao_notas': distribution,
        'tabela': table,
        'avisos': [incomplete_warning(resultados_count, expected_count)] if incomplete_warning(resultados_count, expected_count) else [],
    }


def classe_analysis(params):
    for field in ('ano_lectivo', 'classe'):
        if not params.get(field):
            raise ValidationError({field: f'O campo {field} e obrigatorio.'})

    queryset, _pct = filter_resultados(params)
    turmas = Turma.objects.filter(classe=params.get('classe'), ano_lectivo=params.get('ano_lectivo')).order_by('sala')
    summary = stats(queryset)
    pcts = list(pcts_queryset(params))
    pcts_by_turma = defaultdict(int)
    for pct in pcts:
        pcts_by_turma[pct.lecionacao.turma_id] += 1

    comparacao = []
    expected_count = 0
    for turma in turmas:
        turma_qs = queryset.filter(pct__lecionacao__turma=turma)
        turma_stats = stats(turma_qs)
        alunos_count = turma.alunos.count()
        turma_expected = alunos_count * pcts_by_turma.get(turma.id, 0)
        expected_count += turma_expected
        comparacao.append({
            'turma': {'id': turma.id, 'nome': str(turma), 'sala': turma.sala},
            'media': turma_stats['media'],
            'quantidade_resultados': turma_stats['quantidade_resultados'],
            'alunos_esperados': alunos_count,
            'resultados_esperados': turma_expected,
            'percentual_lancamento': round((turma_stats['quantidade_resultados'] / turma_expected) * 100, 2) if turma_expected else 0,
        })

    evolution_rows = []
    for item in queryset.values('pct__trimestre').annotate(media=Avg('nota'), quantidade=Count('id')).order_by('pct__trimestre'):
        evolution_rows.append({
            'trimestre': item['pct__trimestre'],
            'trimestre_label': pct_label(item['pct__trimestre']),
            'media': decimal_to_float(item['media']),
            'quantidade_resultados': item['quantidade'],
        })

    resultados_count = summary['quantidade_resultados']
    return {
        'filtros': dict(params),
        'classe': params.get('classe'),
        'ano_lectivo': params.get('ano_lectivo'),
        'turmas_incluidas': [{'id': turma.id, 'nome': str(turma)} for turma in turmas],
        'resumo': {
            **{key: value for key, value in summary.items() if key != 'soma'},
            'alunos_esperados': sum(turma.alunos.count() for turma in turmas),
            'resultados_esperados': expected_count,
            'percentual_lancamento': round((resultados_count / expected_count) * 100, 2) if expected_count else 0,
        },
        'media_por_turma': comparacao,
        'comparacao_turmas': comparacao,
        'evolucao_por_trimestre': evolution_from_rows(evolution_rows, value_key='media'),
        'avisos': [incomplete_warning(resultados_count, expected_count)] if incomplete_warning(resultados_count, expected_count) else [],
    }


def ano_lectivo_analysis(params):
    if not params.get('ano_lectivo'):
        raise ValidationError({'ano_lectivo': 'O ano lectivo e obrigatorio.'})

    queryset, _pct = filter_resultados(params)
    summary = stats(queryset)
    pcts = list(pcts_queryset(params))
    expected_count = sum(pct.lecionacao.turma.alunos.count() for pct in pcts)
    resultados_count = summary['quantidade_resultados']

    by_class = []
    for item in queryset.values('pct__lecionacao__turma__classe').annotate(media=Avg('nota'), quantidade=Count('id')).order_by('pct__lecionacao__turma__classe'):
        by_class.append({
            'classe': item['pct__lecionacao__turma__classe'],
            'media': decimal_to_float(item['media']),
            'quantidade_resultados': item['quantidade'],
        })

    by_subject = []
    for item in queryset.values('pct__lecionacao__disciplina_id', 'pct__lecionacao__disciplina__nome').annotate(media=Avg('nota'), quantidade=Count('id')).order_by('pct__lecionacao__disciplina__nome'):
        by_subject.append({
            'disciplina': {'id': item['pct__lecionacao__disciplina_id'], 'nome': item['pct__lecionacao__disciplina__nome']},
            'media': decimal_to_float(item['media']),
            'quantidade_resultados': item['quantidade'],
        })

    evolution = []
    for item in queryset.values('pct__trimestre').annotate(media=Avg('nota'), quantidade=Count('id')).order_by('pct__trimestre'):
        evolution.append({
            'trimestre': item['pct__trimestre'],
            'trimestre_label': pct_label(item['pct__trimestre']),
            'media': decimal_to_float(item['media']),
            'quantidade_resultados': item['quantidade'],
        })

    return {
        'filtros': dict(params),
        'ano_lectivo': params.get('ano_lectivo'),
        'resumo': {
            **{key: value for key, value in summary.items() if key != 'soma'},
            'resultados_esperados': expected_count,
            'percentual_lancamento': round((resultados_count / expected_count) * 100, 2) if expected_count else 0,
        },
        'desempenho_por_classe': by_class,
        'desempenho_por_disciplina': by_subject,
        'evolucao_por_trimestre': evolution_from_rows(evolution, value_key='media'),
        'cobertura': {
            'resultados_lancados': resultados_count,
            'resultados_esperados': expected_count,
            'percentual': round((resultados_count / expected_count) * 100, 2) if expected_count else 0,
        },
        'avisos': [incomplete_warning(resultados_count, expected_count)] if incomplete_warning(resultados_count, expected_count) else [],
    }
