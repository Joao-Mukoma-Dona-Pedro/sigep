import json
import logging
import os
import time
import urllib.error
import urllib.request

from .gateway import AssistantGatewayError, error_payload, execute_gateway_query
from .prompts import SYSTEM_PROMPT
from .tools import ASSISTANT_READ_TOOLS

logger = logging.getLogger(__name__)

OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'
MAX_MESSAGE_LENGTH = 1200
MAX_TOOL_CALLS = 4
MAX_OUTPUT_TOKENS = 700
OPENAI_TIMEOUT_SECONDS = 30


class AssistantProviderError(Exception):
    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(message)


def assistant_unavailable_payload(message='Assistente IA indisponivel. Configure OPENAI_API_KEY para activar o servico.'):
    return {
        'ok': True,
        'assistant_available': False,
        'answer': message,
        'metadata': {
            'provider': 'openai',
            'configured': False,
            'tool_calls': [],
        },
    }


def build_user_prompt(message, route='', page_context='', filters=None):
    filters = filters or {}
    return (
        'Pergunta do utilizador:\n'
        f'{message}\n\n'
        'Contexto visual actual:\n'
        f'- Rota: {route or "nao informada"}\n'
        f'- Pagina: {page_context or "nao informada"}\n'
        f'- Filtros visuais: {json.dumps(filters, ensure_ascii=True)}'
    )


def build_tools_schema():
    return [
        {
            'type': 'function',
            'name': 'execute_sigep_tool',
            'description': 'Executa uma ferramenta autorizada de leitura do SIGEP.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'tool': {
                        'type': 'string',
                        'enum': sorted(ASSISTANT_READ_TOOLS.keys()),
                        'description': 'Nome exacto da ferramenta de leitura permitida.',
                    },
                    'arguments': {
                        'type': 'object',
                        'description': 'Argumentos controlados para a ferramenta.',
                        'additionalProperties': True,
                    },
                },
                'required': ['tool'],
                'additionalProperties': False,
            },
        }
    ]


def extract_output_text(response):
    if isinstance(response.get('output_text'), str) and response['output_text'].strip():
        return response['output_text'].strip()

    parts = []
    for item in response.get('output', []):
        if item.get('type') != 'message':
            continue
        for content in item.get('content', []):
            if content.get('type') in {'output_text', 'text'} and content.get('text'):
                parts.append(content['text'])
    return '\n'.join(parts).strip()


def extract_function_calls(response):
    calls = []
    for item in response.get('output', []):
        if item.get('type') == 'function_call':
            calls.append(item)
    return calls


class OpenAIAssistantProvider:
    def __init__(self, api_key=None, model=None):
        self.api_key = api_key if api_key is not None else os.getenv('OPENAI_API_KEY', '').strip()
        self.model = model or os.getenv('OPENAI_MODEL', DEFAULT_OPENAI_MODEL).strip() or DEFAULT_OPENAI_MODEL

    def is_configured(self):
        return bool(self.api_key)

    def answer(self, user, message, route='', page_context='', filters=None):
        started_at = time.perf_counter()
        if not self.is_configured():
            return assistant_unavailable_payload()

        if len(message or '') > MAX_MESSAGE_LENGTH:
            raise AssistantProviderError('MESSAGE_TOO_LONG', 'A pergunta e demasiado longa para o Assistente SIGEP.')

        tool_calls = []
        response = self._post_openai(
            {
                'model': self.model,
                'input': [
                    {'role': 'system', 'content': SYSTEM_PROMPT},
                    {'role': 'user', 'content': build_user_prompt(message, route, page_context, filters)},
                ],
                'tools': build_tools_schema(),
                'tool_choice': 'auto',
                'max_output_tokens': MAX_OUTPUT_TOKENS,
            }
        )

        loops = 0
        while extract_function_calls(response):
            calls = extract_function_calls(response)
            tool_outputs = []

            for call in calls:
                loops += 1
                if loops > MAX_TOOL_CALLS:
                    return self._final_payload(
                        'Nao consegui concluir a analise com seguranca porque foram necessarias demasiadas consultas internas. Refine a pergunta e tente novamente.',
                        tool_calls,
                        started_at,
                    )

                tool_outputs.append(self._execute_model_tool_call(user, call, tool_calls))

            response = self._post_openai(
                {
                    'model': self.model,
                    'previous_response_id': response.get('id'),
                    'input': tool_outputs,
                    'tools': build_tools_schema(),
                    'tool_choice': 'auto',
                    'max_output_tokens': MAX_OUTPUT_TOKENS,
                }
            )

        answer = extract_output_text(response)
        if not answer:
            answer = 'Nao foi possivel gerar uma resposta util neste momento.'

        return self._final_payload(answer, tool_calls, started_at)

    def _execute_model_tool_call(self, user, call, tool_calls):
        call_id = call.get('call_id') or call.get('id')
        output = error_payload('INVALID_TOOL_CALL', 'Chamada de ferramenta invalida.')

        try:
            if call.get('name') != 'execute_sigep_tool':
                output = error_payload('TOOL_NOT_ALLOWED', 'Ferramenta nao disponivel.')
            else:
                arguments = json.loads(call.get('arguments') or '{}')
                tool_name = arguments.get('tool')
                tool_arguments = arguments.get('arguments') or {}
                tool_calls.append(tool_name)
                output = execute_gateway_query(user, tool_name, tool_arguments)
        except json.JSONDecodeError:
            output = error_payload('INVALID_ARGUMENTS', 'Argumentos invalidos.')
        except AssistantGatewayError as exc:
            output = error_payload(exc.code, exc.message)
        except Exception:
            logger.error(
                'assistant_openai tool_call_error user=%s',
                getattr(user, 'id', None),
            )
            output = error_payload('INTERNAL_ERROR', 'Erro interno ao consultar ferramenta.')

        return {
            'type': 'function_call_output',
            'call_id': call_id,
            'output': json.dumps(output, ensure_ascii=True, default=str),
        }

    def _post_openai(self, payload):
        body = json.dumps(payload).encode('utf-8')
        request = urllib.request.Request(
            OPENAI_RESPONSES_URL,
            data=body,
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )

        try:
            with urllib.request.urlopen(request, timeout=OPENAI_TIMEOUT_SECONDS) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as exc:
            self._raise_http_error(exc)
        except (urllib.error.URLError, TimeoutError) as exc:
            logger.warning('assistant_openai unavailable reason=%s', exc.__class__.__name__)
            raise AssistantProviderError('OPENAI_UNAVAILABLE', 'Servico de IA temporariamente indisponivel.')
        except json.JSONDecodeError:
            raise AssistantProviderError('OPENAI_INVALID_RESPONSE', 'Resposta invalida do servico de IA.')

    def _raise_http_error(self, exc):
        status = getattr(exc, 'code', None)
        if status == 401:
            raise AssistantProviderError('OPENAI_AUTH_ERROR', 'Configuracao da IA invalida.')
        if status == 429:
            raise AssistantProviderError('OPENAI_RATE_LIMIT', 'Limite temporario do servico de IA atingido.')
        logger.warning('assistant_openai http_error status=%s', status)
        raise AssistantProviderError('OPENAI_UNAVAILABLE', 'Servico de IA temporariamente indisponivel.')

    def _final_payload(self, answer, tool_calls, started_at):
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
        return {
            'ok': True,
            'assistant_available': True,
            'answer': answer,
            'metadata': {
                'provider': 'openai',
                'model': self.model,
                'tool_calls': tool_calls,
                'duration_ms': duration_ms,
            },
        }

