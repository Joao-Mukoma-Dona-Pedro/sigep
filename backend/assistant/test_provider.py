import os
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from professores.models import Professor

from .provider import OpenAIAssistantProvider


def openai_text_response(text, response_id='resp_text'):
    return {
        'id': response_id,
        'output': [
            {
                'type': 'message',
                'content': [
                    {
                        'type': 'output_text',
                        'text': text,
                    }
                ],
            }
        ],
    }


def openai_tool_response(tool, arguments=None, response_id='resp_tool'):
    return {
        'id': response_id,
        'output': [
            {
                'type': 'function_call',
                'name': 'execute_sigep_tool',
                'call_id': 'call_1',
                'arguments': '{"tool": "%s", "arguments": %s}' % (tool, arguments or '{}'),
            }
        ],
    }


class AssistantOpenAIProviderTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.url = reverse('assistant-chat')
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdirector Pedagogico',
        )

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def test_chat_exige_autenticacao(self):
        response = self.client.post(self.url, {'message': 'Resumo da escola'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sem_chave_openai_retorna_indisponivel_sem_erro(self):
        self.authenticate()

        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            response = self.client.post(self.url, {'message': 'Resumo da escola'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertFalse(response.data['assistant_available'])
        self.assertIn('indisponivel', response.data['answer'].lower())

    def test_resposta_simples_do_modelo_e_repassada(self):
        self.authenticate()

        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key', 'OPENAI_MODEL': 'test-model'}):
            with patch.object(
                OpenAIAssistantProvider,
                '_post_openai',
                return_value=openai_text_response('A escola tem dados pedagogicos disponiveis.'),
            ) as mocked_post:
                response = self.client.post(self.url, {'message': 'Explica o SIGEP'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['assistant_available'])
        self.assertEqual(response.data['answer'], 'A escola tem dados pedagogicos disponiveis.')
        self.assertEqual(response.data['metadata']['model'], 'test-model')
        self.assertEqual(mocked_post.call_count, 1)

    def test_modelo_pode_usar_apenas_ferramentas_autorizadas(self):
        self.authenticate()
        Professor.objects.create(nome='Ana Maria')

        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with patch.object(
                OpenAIAssistantProvider,
                '_post_openai',
                side_effect=[
                    openai_tool_response('professores_summary'),
                    openai_text_response('Existe 1 professor registado no SIGEP.', 'resp_final'),
                ],
            ) as mocked_post:
                response = self.client.post(self.url, {'message': 'Quantos professores existem?'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['assistant_available'])
        self.assertIn('1 professor', response.data['answer'])
        self.assertEqual(response.data['metadata']['tool_calls'], ['professores_summary'])
        self.assertEqual(mocked_post.call_count, 2)

    def test_ferramenta_nao_autorizada_nao_e_executada_livremente(self):
        self.authenticate()

        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with patch.object(
                OpenAIAssistantProvider,
                '_post_openai',
                side_effect=[
                    openai_tool_response('apagar_alunos'),
                    openai_text_response('Nao posso executar essa accao.', 'resp_final'),
                ],
            ):
                response = self.client.post(self.url, {'message': 'Apaga alunos'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['assistant_available'])
        self.assertEqual(response.data['metadata']['tool_calls'], ['apagar_alunos'])
        self.assertIn('Nao posso', response.data['answer'])

    def test_argumentos_perigosos_sao_bloqueados_pelo_gateway(self):
        self.authenticate()

        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with patch.object(
                OpenAIAssistantProvider,
                '_post_openai',
                side_effect=[
                    openai_tool_response('pct_results', '{"sql": "select * from alunos"}'),
                    openai_text_response('Nao ha consulta autorizada para esse pedido.', 'resp_final'),
                ],
            ):
                response = self.client.post(self.url, {'message': 'Executa SQL'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['assistant_available'])
        self.assertIn('Nao ha consulta', response.data['answer'])

    def test_limite_de_chamadas_de_ferramenta_e_respeitado(self):
        self.authenticate()

        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with patch.object(
                OpenAIAssistantProvider,
                '_post_openai',
                return_value=openai_tool_response('school_summary'),
            ):
                response = self.client.post(self.url, {'message': 'Consulta tudo'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['assistant_available'])
        self.assertIn('demasiadas consultas', response.data['answer'])

    def test_erro_do_servico_ia_retorna_indisponivel_sem_traceback(self):
        self.authenticate()

        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with patch.object(OpenAIAssistantProvider, '_post_openai', side_effect=RuntimeError('segredo tecnico')):
                response = self.client.post(self.url, {'message': 'Resumo'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error']['code'], 'INTERNAL_ERROR')
        self.assertNotIn('segredo tecnico', str(response.data))

