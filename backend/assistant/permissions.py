class AssistantPermissionError(Exception):
    code = 'AUTHENTICATION_REQUIRED'


def ensure_assistant_access(user):
    if not user or not getattr(user, 'is_authenticated', False):
        raise AssistantPermissionError('Utilizador autenticado e obrigatorio para usar ferramentas do Assistente.')

