from django.utils import timezone


class AssistantToolError(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


def success_response(data, warnings=None):
    return {
        'ok': True,
        'data': data,
        'warnings': warnings or [],
        'metadata': {
            'source': 'sigep',
            'generated_at': timezone.now().isoformat(),
        },
    }


def error_response(code, message):
    return {
        'ok': False,
        'error': {
            'code': code,
            'message': message,
        },
        'metadata': {
            'source': 'sigep',
            'generated_at': timezone.now().isoformat(),
        },
    }


def parse_int(value, field):
    if value in (None, ''):
        return None
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise AssistantToolError('INVALID_FILTER', f'O filtro {field} deve ser numerico.') from exc


def normalize_filters(filters):
    return dict(filters or {})

