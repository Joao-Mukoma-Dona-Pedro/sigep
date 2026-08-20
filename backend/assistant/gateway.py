import logging
import time

from django.core.cache import cache

from .tools import ASSISTANT_READ_TOOLS

logger = logging.getLogger(__name__)

RATE_LIMIT_REQUESTS = 60
RATE_LIMIT_WINDOW_SECONDS = 60

NO_ARGUMENT_TOOLS = {
    'school_summary',
    'professores_summary',
    'disciplinas_summary',
    'turmas_summary',
    'alunos_summary',
    'leccionacoes_summary',
    'planificacoes_summary',
    'controlo_aulas_summary',
    'pct_summary',
    'ocorrencias_summary',
}

ID_ARGUMENT_TOOLS = {
    'professor': ('professor_id',),
    'professor_activity': ('professor_id',),
    'disciplina': ('disciplina_id',),
    'turma': ('turma_id',),
    'aluno': ('aluno_id',),
}

FILTER_ARGUMENT_TOOLS = {
    'leccionacoes',
    'planificacoes',
    'controlo_aulas',
    'pct_results',
    'ocorrencias',
    'reunioes_summary',
}

ALLOWED_FILTER_KEYS = {
    'professor',
    'professor_id',
    'disciplina',
    'disciplina_id',
    'turma',
    'turma_id',
    'ano_lectivo',
    'trimestre',
    'data_inicio',
    'data_fim',
    'pct',
    'pct_id',
    'aluno',
    'aluno_id',
    'classe',
    'categoria',
    'tipo',
    'tipo_id',
}

PCT_ANALYSIS_ARGUMENT_KEYS = {
    'analysis_type',
    'filters',
}

DANGEROUS_KEYS = {
    'sql',
    'query',
    'raw_sql',
    'command',
    'code',
    'python',
    'eval',
    'exec',
    'import',
    'importlib',
    '__import__',
    '__class__',
    '__dict__',
}


class AssistantGatewayError(Exception):
    def __init__(self, code, message, status_code=400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def error_payload(code, message):
    return {
        'ok': False,
        'error': {
            'code': code,
            'message': message,
        },
    }


def contains_dangerous_key(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() in DANGEROUS_KEYS:
                return True
            if contains_dangerous_key(child):
                return True
    if isinstance(value, list):
        return any(contains_dangerous_key(item) for item in value)
    return False


def ensure_rate_limit(user):
    key = f'assistant-gateway-rate:{user.id}'
    current = cache.get(key, 0)
    if current >= RATE_LIMIT_REQUESTS:
        raise AssistantGatewayError(
            'RATE_LIMIT_EXCEEDED',
            'Limite temporario de consultas ao Assistente atingido. Tente novamente dentro de instantes.',
            429,
        )
    cache.set(key, current + 1, RATE_LIMIT_WINDOW_SECONDS)


def validate_tool_arguments(tool_name, arguments):
    if contains_dangerous_key(arguments):
        raise AssistantGatewayError('INVALID_ARGUMENTS', 'Argumentos nao permitidos.')

    if tool_name in NO_ARGUMENT_TOOLS:
        if arguments:
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'Esta ferramenta nao aceita argumentos.')
        return {}

    if tool_name in ID_ARGUMENT_TOOLS:
        allowed_keys = set(ID_ARGUMENT_TOOLS[tool_name])
        unknown = set(arguments) - allowed_keys
        if unknown:
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'Argumentos desconhecidos para esta ferramenta.')
        required_key = ID_ARGUMENT_TOOLS[tool_name][0]
        if required_key not in arguments:
            raise AssistantGatewayError('INVALID_ARGUMENTS', f'O argumento {required_key} e obrigatorio.')
        return arguments

    if tool_name in FILTER_ARGUMENT_TOOLS:
        unknown = set(arguments) - ALLOWED_FILTER_KEYS
        if unknown:
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'Argumentos desconhecidos para esta ferramenta.')
        return arguments

    if tool_name == 'pct_analysis':
        unknown = set(arguments) - PCT_ANALYSIS_ARGUMENT_KEYS
        if unknown:
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'Argumentos desconhecidos para esta ferramenta.')
        if not arguments.get('analysis_type'):
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'O argumento analysis_type e obrigatorio.')
        filters = arguments.get('filters') or {}
        if not isinstance(filters, dict):
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'O argumento filters deve ser um objecto.')
        unknown_filters = set(filters) - ALLOWED_FILTER_KEYS
        if unknown_filters:
            raise AssistantGatewayError('INVALID_ARGUMENTS', 'Filtros desconhecidos para esta ferramenta.')
        return arguments

    raise AssistantGatewayError('TOOL_NOT_ALLOWED', 'Ferramenta nao disponivel.', 400)


def execute_tool(user, tool_name, arguments):
    if tool_name not in ASSISTANT_READ_TOOLS:
        raise AssistantGatewayError('TOOL_NOT_ALLOWED', 'Ferramenta nao disponivel.', 400)

    safe_arguments = validate_tool_arguments(tool_name, arguments or {})
    func = ASSISTANT_READ_TOOLS[tool_name]

    if tool_name in NO_ARGUMENT_TOOLS:
        return func(user)
    if tool_name in ID_ARGUMENT_TOOLS:
        required_key = ID_ARGUMENT_TOOLS[tool_name][0]
        return func(user, safe_arguments[required_key])
    if tool_name in FILTER_ARGUMENT_TOOLS:
        return func(user, safe_arguments)
    if tool_name == 'pct_analysis':
        return func(user, safe_arguments['analysis_type'], safe_arguments.get('filters') or {})

    raise AssistantGatewayError('TOOL_NOT_ALLOWED', 'Ferramenta nao disponivel.', 400)


def execute_gateway_query(user, tool_name, arguments):
    started_at = time.perf_counter()
    ensure_rate_limit(user)

    try:
        result = execute_tool(user, tool_name, arguments)
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        result.setdefault('metadata', {})
        result['metadata']['tool'] = tool_name
        result['metadata']['duration_ms'] = duration_ms
        logger.info(
            'assistant_gateway tool=%s user=%s ok=%s duration_ms=%s',
            tool_name,
            getattr(user, 'id', None),
            result.get('ok'),
            duration_ms,
        )
        return result
    except AssistantGatewayError:
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        logger.warning(
            'assistant_gateway tool=%s user=%s ok=false duration_ms=%s',
            tool_name,
            getattr(user, 'id', None),
            duration_ms,
        )
        raise

