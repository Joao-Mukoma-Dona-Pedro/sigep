from django.db.models import Avg, Count, Q

from alunos.models import Aluno
from aulas.models import ControloAula
from disciplinas.models import Disciplina
from ocorrencias.models import Ocorrencia
from pct import analytics as pct_analytics
from pct.models import PCT, ResultadoPCT
from planificacoes.models import Planificacao
from professores.models import Lecionacao, Professor
from reunioes.models import Reuniao
from tipos_ocorrencias.models import TipoOcorrencia
from turmas.models import Turma

from .permissions import AssistantPermissionError, ensure_assistant_access
from .schemas import AssistantToolError, error_response, normalize_filters, parse_int, success_response


def tool(user):
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                ensure_assistant_access(user)
                return success_response(func(*args, **kwargs))
            except AssistantPermissionError as exc:
                return error_response(exc.code, str(exc))
            except AssistantToolError as exc:
                return error_response(exc.code, exc.message)
        return wrapper
    return decorator


def distribution(queryset, field, label_key='label', value_key='total'):
    return [
        {label_key: item[field] or '-', value_key: item['total']}
        for item in queryset.values(field).annotate(total=Count('id')).order_by(field)
    ]


def pct_status_counts(queryset):
    status = {'sem_resultados': 0, 'parcialmente_lancadas': 0, 'completamente_lancadas': 0}
    for pct in queryset:
        expected = pct.lecionacao.turma.alunos.count()
        actual = pct.resultados.count()
        if actual == 0:
            status['sem_resultados'] += 1
        elif expected and actual >= expected:
            status['completamente_lancadas'] += 1
        else:
            status['parcialmente_lancadas'] += 1
    return status


def apply_lecionacao_filters(queryset, filters):
    filters = normalize_filters(filters)
    professor = parse_int(filters.get('professor') or filters.get('professor_id'), 'professor')
    disciplina = parse_int(filters.get('disciplina') or filters.get('disciplina_id'), 'disciplina')
    turma = parse_int(filters.get('turma') or filters.get('turma_id'), 'turma')
    ano_lectivo = filters.get('ano_lectivo')

    if professor:
        queryset = queryset.filter(lecionacao__professor_id=professor)
    if disciplina:
        queryset = queryset.filter(lecionacao__disciplina_id=disciplina)
    if turma:
        queryset = queryset.filter(lecionacao__turma_id=turma)
    if ano_lectivo:
        queryset = queryset.filter(lecionacao__ano_lectivo=ano_lectivo)
    return queryset


def validate_turma_year(turma_id, ano_lectivo):
    if not turma_id or not ano_lectivo:
        return
    turma = Turma.objects.filter(id=turma_id).first()
    if not turma:
        raise AssistantToolError('INVALID_FILTER', 'Turma nao encontrada.')
    if turma.ano_lectivo != ano_lectivo:
        raise AssistantToolError('INVALID_FILTER', 'A turma informada nao pertence ao ano lectivo indicado.')


def get_school_summary(user):
    @tool(user)
    def run():
        pct_data = get_pct_summary(user)['data']
        return {
            'professores': get_professores_summary(user)['data'],
            'disciplinas': get_disciplinas_summary(user)['data'],
            'turmas': {'total': Turma.objects.count()},
            'alunos': {'total': Aluno.objects.count()},
            'planificacoes': {
                'total': Planificacao.objects.count(),
                'entregues': Planificacao.objects.filter(entregou=True).count(),
                'nao_entregues': Planificacao.objects.filter(entregou=False).count(),
            },
            'controlo_aulas': {
                'total': ControloAula.objects.count(),
                'aulas_assistidas': ControloAula.objects.filter(aula_assistida=True).count(),
                'aulas_nao_assistidas': ControloAula.objects.filter(aula_assistida=False).count(),
            },
            'pct': pct_data,
            'ocorrencias': {'total': Ocorrencia.objects.count()},
            'reunioes': {'total': Reuniao.objects.count()},
        }
    return run()


def get_professores_summary(user):
    @tool(user)
    def run():
        return {
            'total': Professor.objects.count(),
            'activos': Professor.objects.filter(estado=Professor.Estado.ATIVO).count(),
            'inactivos': Professor.objects.filter(estado=Professor.Estado.INATIVO).count(),
        }
    return run()


def get_professor(user, professor_id):
    @tool(user)
    def run():
        professor = Professor.objects.filter(id=parse_int(professor_id, 'professor_id')).first()
        if not professor:
            raise AssistantToolError('NOT_FOUND', 'Professor nao encontrado.')
        return {
            'id': professor.id,
            'nome': professor.nome,
            'estado': professor.estado,
            'leccionacoes': professor.lecionacoes.count(),
            'planificacoes': Planificacao.objects.filter(lecionacao__professor=professor).count(),
            'controlo_aulas': ControloAula.objects.filter(lecionacao__professor=professor).count(),
            'pct': PCT.objects.filter(lecionacao__professor=professor).count(),
        }
    return run()


def get_professor_activity(user, professor_id):
    @tool(user)
    def run():
        professor_id_int = parse_int(professor_id, 'professor_id')
        if not Professor.objects.filter(id=professor_id_int).exists():
            raise AssistantToolError('NOT_FOUND', 'Professor nao encontrado.')
        return {
            'professor_id': professor_id_int,
            'leccionacoes': Lecionacao.objects.filter(professor_id=professor_id_int).count(),
            'planificacoes': {
                'total': Planificacao.objects.filter(lecionacao__professor_id=professor_id_int).count(),
                'entregues': Planificacao.objects.filter(lecionacao__professor_id=professor_id_int, entregou=True).count(),
                'nao_entregues': Planificacao.objects.filter(lecionacao__professor_id=professor_id_int, entregou=False).count(),
            },
            'controlo_aulas': {
                'total': ControloAula.objects.filter(lecionacao__professor_id=professor_id_int).count(),
                'assistidas': ControloAula.objects.filter(lecionacao__professor_id=professor_id_int, aula_assistida=True).count(),
                'nao_assistidas': ControloAula.objects.filter(lecionacao__professor_id=professor_id_int, aula_assistida=False).count(),
            },
            'pct': PCT.objects.filter(lecionacao__professor_id=professor_id_int).count(),
        }
    return run()


def get_disciplinas_summary(user):
    @tool(user)
    def run():
        return {
            'total': Disciplina.objects.count(),
            'activas': Disciplina.objects.filter(estado=Disciplina.Estado.ATIVO).count(),
            'inactivas': Disciplina.objects.filter(estado=Disciplina.Estado.INATIVO).count(),
        }
    return run()


def get_disciplina(user, disciplina_id):
    @tool(user)
    def run():
        disciplina = Disciplina.objects.filter(id=parse_int(disciplina_id, 'disciplina_id')).first()
        if not disciplina:
            raise AssistantToolError('NOT_FOUND', 'Disciplina nao encontrada.')
        return {
            'id': disciplina.id,
            'nome': disciplina.nome,
            'codigo': disciplina.codigo,
            'estado': disciplina.estado,
            'leccionacoes': disciplina.lecionacoes.count(),
        }
    return run()


def get_turmas_summary(user):
    @tool(user)
    def run():
        return {
            'total': Turma.objects.count(),
            'por_classe': distribution(Turma.objects.all(), 'classe', 'classe'),
            'por_ano_lectivo': distribution(Turma.objects.all(), 'ano_lectivo', 'ano_lectivo'),
        }
    return run()


def get_turma(user, turma_id):
    @tool(user)
    def run():
        turma = Turma.objects.select_related('diretor_turma').filter(id=parse_int(turma_id, 'turma_id')).first()
        if not turma:
            raise AssistantToolError('NOT_FOUND', 'Turma nao encontrada.')
        return {
            'id': turma.id,
            'turma': str(turma),
            'classe': turma.classe,
            'sala': turma.sala,
            'ano_lectivo': turma.ano_lectivo,
            'periodo': turma.periodo,
            'turno': turma.turno,
            'quantidade_alunos': turma.alunos.count(),
            'diretor_turma': turma.diretor_turma.nome if turma.diretor_turma else None,
        }
    return run()


def get_alunos_summary(user):
    @tool(user)
    def run():
        return {
            'total': Aluno.objects.count(),
            'por_turma': [
                {'turma': str(item), 'turma_id': item.id, 'total': item.alunos.count()}
                for item in Turma.objects.order_by('ano_lectivo', 'classe', 'sala')
            ],
            'por_classe': [
                {'classe': item['turma__classe'] or '-', 'total': item['total']}
                for item in Aluno.objects.values('turma__classe').annotate(total=Count('id')).order_by('turma__classe')
            ],
        }
    return run()


def get_aluno(user, aluno_id):
    @tool(user)
    def run():
        aluno = Aluno.objects.select_related('turma').filter(id=parse_int(aluno_id, 'aluno_id')).first()
        if not aluno:
            raise AssistantToolError('NOT_FOUND', 'Aluno nao encontrado.')
        return {
            'id': aluno.id,
            'nome': aluno.nome,
            'numero': aluno.numero,
            'turma': str(aluno.turma),
            'turma_id': aluno.turma_id,
            'classe': aluno.turma.classe,
            'estado': aluno.estado,
            'resultados_pct': aluno.resultados_pct.count(),
            'ocorrencias': aluno.ocorrencias.count(),
        }
    return run()


def get_leccionacoes_summary(user):
    @tool(user)
    def run():
        queryset = Lecionacao.objects.select_related('professor', 'disciplina', 'turma')
        return {
            'total': queryset.count(),
            'por_professor': distribution(queryset, 'professor__nome', 'professor'),
            'por_disciplina': distribution(queryset, 'disciplina__nome', 'disciplina'),
            'por_turma': distribution(queryset, 'turma__sala', 'turma'),
            'por_ano_lectivo': distribution(queryset, 'ano_lectivo', 'ano_lectivo'),
        }
    return run()


def get_leccionacoes(user, filters=None):
    @tool(user)
    def run():
        filters_data = normalize_filters(filters)
        validate_turma_year(parse_int(filters_data.get('turma') or filters_data.get('turma_id'), 'turma'), filters_data.get('ano_lectivo'))
        queryset = Lecionacao.objects.select_related('professor', 'disciplina', 'turma')
        if filters_data.get('professor') or filters_data.get('professor_id'):
            queryset = queryset.filter(professor_id=parse_int(filters_data.get('professor') or filters_data.get('professor_id'), 'professor'))
        if filters_data.get('disciplina') or filters_data.get('disciplina_id'):
            queryset = queryset.filter(disciplina_id=parse_int(filters_data.get('disciplina') or filters_data.get('disciplina_id'), 'disciplina'))
        if filters_data.get('turma') or filters_data.get('turma_id'):
            queryset = queryset.filter(turma_id=parse_int(filters_data.get('turma') or filters_data.get('turma_id'), 'turma'))
        if filters_data.get('ano_lectivo'):
            queryset = queryset.filter(ano_lectivo=filters_data.get('ano_lectivo'))
        return {
            'total': queryset.count(),
            'items': [
                {
                    'id': item.id,
                    'professor': item.professor.nome,
                    'disciplina': item.disciplina.nome,
                    'turma': str(item.turma),
                    'ano_lectivo': item.ano_lectivo,
                    'estado': item.estado,
                }
                for item in queryset[:50]
            ],
        }
    return run()


def get_planificacoes_summary(user):
    @tool(user)
    def run():
        queryset = Planificacao.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma')
        return {
            'total': queryset.count(),
            'entregues': queryset.filter(entregou=True).count(),
            'nao_entregues': queryset.filter(entregou=False).count(),
            'pendentes': queryset.filter(entregou=False).count(),
            'sem_leccionacao': queryset.filter(lecionacao__isnull=True).count(),
            'por_professor': distribution(queryset.exclude(lecionacao=None), 'lecionacao__professor__nome', 'professor'),
        }
    return run()


def get_planificacoes(user, filters=None):
    @tool(user)
    def run():
        filters_data = normalize_filters(filters)
        validate_turma_year(parse_int(filters_data.get('turma') or filters_data.get('turma_id'), 'turma'), filters_data.get('ano_lectivo'))
        queryset = apply_lecionacao_filters(Planificacao.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma'), filters_data)
        if filters_data.get('trimestre'):
            queryset = queryset.filter(trimestre=filters_data.get('trimestre'))
        return {
            'total': queryset.count(),
            'items': [
                {
                    'id': item.id,
                    'professor': item.lecionacao.professor.nome if item.lecionacao_id else None,
                    'disciplina': item.lecionacao.disciplina.nome if item.lecionacao_id else None,
                    'turma': str(item.lecionacao.turma) if item.lecionacao_id else None,
                    'ano_lectivo': item.lecionacao.ano_lectivo if item.lecionacao_id else None,
                    'trimestre': item.trimestre,
                    'data_entrega': item.data_entrega,
                    'entregou': item.entregou,
                }
                for item in queryset[:50]
            ],
        }
    return run()


def get_controlo_aulas_summary(user):
    @tool(user)
    def run():
        queryset = ControloAula.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma')
        return {
            'total': queryset.count(),
            'aulas_assistidas': queryset.filter(aula_assistida=True).count(),
            'aulas_nao_assistidas': queryset.filter(aula_assistida=False).count(),
            'por_professor': distribution(queryset, 'lecionacao__professor__nome', 'professor'),
            'por_disciplina': distribution(queryset, 'lecionacao__disciplina__nome', 'disciplina'),
            'por_turma': distribution(queryset, 'lecionacao__turma__sala', 'turma'),
            'por_periodo': distribution(queryset, 'lecionacao__turma__periodo', 'periodo'),
        }
    return run()


def get_controlo_aulas(user, filters=None):
    @tool(user)
    def run():
        filters_data = normalize_filters(filters)
        validate_turma_year(parse_int(filters_data.get('turma') or filters_data.get('turma_id'), 'turma'), filters_data.get('ano_lectivo'))
        queryset = apply_lecionacao_filters(ControloAula.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma'), filters_data)
        if filters_data.get('data_inicio'):
            queryset = queryset.filter(data__gte=filters_data.get('data_inicio'))
        if filters_data.get('data_fim'):
            queryset = queryset.filter(data__lte=filters_data.get('data_fim'))
        return {
            'total': queryset.count(),
            'items': [
                {
                    'id': item.id,
                    'professor': item.lecionacao.professor.nome,
                    'disciplina': item.lecionacao.disciplina.nome,
                    'turma': str(item.lecionacao.turma),
                    'ano_lectivo': item.lecionacao.ano_lectivo,
                    'data': item.data,
                    'aula_assistida': item.aula_assistida,
                }
                for item in queryset[:50]
            ],
        }
    return run()


def get_pct_summary(user):
    @tool(user)
    def run():
        queryset = PCT.objects.select_related('lecionacao__turma', 'lecionacao__disciplina').prefetch_related('resultados', 'lecionacao__turma__alunos')
        result_status = pct_status_counts(queryset)
        return {
            'total': queryset.count(),
            'por_trimestre': distribution(queryset, 'trimestre', 'trimestre'),
            'por_ano_lectivo': distribution(queryset, 'lecionacao__ano_lectivo', 'ano_lectivo'),
            'com_resultados': queryset.filter(resultados__isnull=False).distinct().count(),
            **result_status,
        }
    return run()


def get_pct_results(user, filters=None):
    @tool(user)
    def run():
        filters_data = normalize_filters(filters)
        queryset, _pct = pct_analytics.filter_resultados(filters_data, require_year=False)
        aggregate = queryset.aggregate(media=Avg('nota'), total=Count('id'))
        return {
            'total_resultados': aggregate['total'] or 0,
            'media': pct_analytics.decimal_to_float(aggregate['media']),
            'items': [
                {
                    'resultado_id': item.id,
                    'pct': item.pct_id,
                    'aluno_id': item.aluno_id,
                    'aluno': item.aluno.nome if filters_data.get('aluno') else None,
                    'turma': str(item.pct.lecionacao.turma),
                    'classe': item.pct.lecionacao.turma.classe,
                    'disciplina': item.pct.lecionacao.disciplina.nome,
                    'trimestre': item.pct.trimestre,
                    'ano_lectivo': item.pct.lecionacao.ano_lectivo,
                    'nota': pct_analytics.decimal_to_float(item.nota),
                }
                for item in queryset[:100]
            ],
        }
    return run()


def get_pct_analysis(user, analysis_type, filters=None):
    @tool(user)
    def run():
        params = normalize_filters(filters)
        handlers = {
            'individual': pct_analytics.individual_analysis,
            'turma': pct_analytics.turma_analysis,
            'classe': pct_analytics.classe_analysis,
            'ano_lectivo': pct_analytics.ano_lectivo_analysis,
        }
        handler = handlers.get(analysis_type)
        if not handler:
            raise AssistantToolError('INVALID_FILTER', 'Tipo de analise PCT invalido.')
        try:
            return handler(params)
        except Exception as exc:
            raise AssistantToolError('INVALID_FILTER', str(exc)) from exc
    return run()


def get_ocorrencias_summary(user):
    @tool(user)
    def run():
        queryset = Ocorrencia.objects.select_related('aluno__turma', 'tipo')
        return {
            'total': queryset.count(),
            'por_categoria': distribution(queryset, 'tipo__categoria', 'categoria'),
            'por_tipo': distribution(queryset, 'tipo__descricao', 'tipo'),
            'por_turma': distribution(queryset, 'aluno__turma__sala', 'turma'),
            'por_periodo': distribution(queryset, 'data_ocorrencia__year', 'ano'),
        }
    return run()


def get_ocorrencias(user, filters=None):
    @tool(user)
    def run():
        filters_data = normalize_filters(filters)
        queryset = Ocorrencia.objects.select_related('aluno__turma', 'tipo', 'registada_por')
        aluno = parse_int(filters_data.get('aluno') or filters_data.get('aluno_id'), 'aluno')
        turma = parse_int(filters_data.get('turma') or filters_data.get('turma_id'), 'turma')
        tipo = parse_int(filters_data.get('tipo') or filters_data.get('tipo_id'), 'tipo')
        professor = parse_int(filters_data.get('professor') or filters_data.get('professor_id'), 'professor')
        if aluno:
            queryset = queryset.filter(aluno_id=aluno)
        if turma:
            queryset = queryset.filter(aluno__turma_id=turma)
        if tipo:
            queryset = queryset.filter(tipo_id=tipo)
        if professor:
            queryset = queryset.filter(registada_por_id=professor)
        if filters_data.get('categoria'):
            queryset = queryset.filter(tipo__categoria=filters_data.get('categoria'))
        if filters_data.get('data_inicio'):
            queryset = queryset.filter(data_ocorrencia__gte=filters_data.get('data_inicio'))
        if filters_data.get('data_fim'):
            queryset = queryset.filter(data_ocorrencia__lte=filters_data.get('data_fim'))
        include_student = bool(aluno)
        return {
            'total': queryset.count(),
            'items': [
                {
                    'id': item.id,
                    'aluno_id': item.aluno_id,
                    'aluno': item.aluno.nome if include_student else None,
                    'turma': str(item.aluno.turma),
                    'categoria': item.tipo.categoria,
                    'tipo': item.tipo.descricao,
                    'data_ocorrencia': item.data_ocorrencia,
                    'registada_por': item.registada_por.nome,
                }
                for item in queryset[:50]
            ],
        }
    return run()


def get_reunioes_summary(user, filters=None):
    @tool(user)
    def run():
        filters_data = normalize_filters(filters)
        queryset = Reuniao.objects.all()
        if filters_data.get('data_inicio'):
            queryset = queryset.filter(data__gte=filters_data.get('data_inicio'))
        if filters_data.get('data_fim'):
            queryset = queryset.filter(data__lte=filters_data.get('data_fim'))
        return {
            'total': queryset.count(),
            'por_periodo': distribution(queryset, 'data__year', 'ano'),
            'items': [
                {'id': item.id, 'data': item.data, 'assunto': item.assunto, 'decisoes': item.decisoes}
                for item in queryset[:30]
            ],
        }
    return run()


ASSISTANT_READ_TOOLS = {
    'school_summary': get_school_summary,
    'professores_summary': get_professores_summary,
    'professor': get_professor,
    'professor_activity': get_professor_activity,
    'disciplinas_summary': get_disciplinas_summary,
    'disciplina': get_disciplina,
    'turmas_summary': get_turmas_summary,
    'turma': get_turma,
    'alunos_summary': get_alunos_summary,
    'aluno': get_aluno,
    'leccionacoes_summary': get_leccionacoes_summary,
    'leccionacoes': get_leccionacoes,
    'planificacoes_summary': get_planificacoes_summary,
    'planificacoes': get_planificacoes,
    'controlo_aulas_summary': get_controlo_aulas_summary,
    'controlo_aulas': get_controlo_aulas,
    'pct_summary': get_pct_summary,
    'pct_results': get_pct_results,
    'pct_analysis': get_pct_analysis,
    'ocorrencias_summary': get_ocorrencias_summary,
    'ocorrencias': get_ocorrencias,
    'reunioes_summary': get_reunioes_summary,
}

