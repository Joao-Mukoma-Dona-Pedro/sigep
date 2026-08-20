from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from disciplinas.models import Disciplina
from pct.models import PCT, ResultadoPCT
from professores.models import Lecionacao, Professor
from turmas.models import Turma

from . import gateway


class AssistantGatewayAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.url = reverse('assistant-query')
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdirector Pedagogico',
        )
        self.non_admin = get_user_model().objects.create_user(
            email='secretaria@sigep.local',
            password='SenhaForte123',
            full_name='Secretaria',
            role='OTHER',
        )
        self.professor = Professor.objects.create(nome='Ana Maria')
        self.disciplina = Disciplina.objects.create(nome='Matematica', codigo='MAT')
        self.turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            turno='Regular',
            capacidade=30,
            diretor_turma=self.professor,
        )
        self.aluno = Aluno.objects.create(turma=self.turma, numero=1, nome='Carlos Pedro')
        self.lecionacao = Lecionacao.objects.create(
            professor=self.professor,
            disciplina=self.disciplina,
            turma=self.turma,
            ano_lectivo='2026',
        )
        self.pct = PCT.objects.create(
            lecionacao=self.lecionacao,
            trimestre=PCT.Trimestre.PRIMEIRO,
            data_aplicacao='2026-03-20',
        )
        ResultadoPCT.objects.create(pct=self.pct, aluno=self.aluno, nota='15.00')

    def authenticate(self, user=None):
        self.client.force_authenticate(user=user or self.user)

    def post_tool(self, tool, arguments=None):
        return self.client.post(
            self.url,
            {'tool': tool, 'arguments': arguments or {}},
            format='json',
        )

    def test_utilizador_nao_autenticado_recebe_401(self):
        response = self.post_tool('school_summary')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_utilizador_sem_permissao_recebe_403(self):
        self.authenticate(self.non_admin)

        response = self.post_tool('school_summary')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ferramenta_valida_retorna_dados_reais(self):
        self.authenticate()

        response = self.post_tool('school_summary')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ok'])
        self.assertEqual(response.data['data']['professores']['total'], 1)
        self.assertEqual(response.data['data']['alunos']['total'], 1)
        self.assertEqual(response.data['metadata']['tool'], 'school_summary')

    def test_pct_summary_retorna_dados_reais(self):
        self.authenticate()

        response = self.post_tool('pct_summary')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['total'], 1)
        self.assertEqual(response.data['data']['com_resultados'], 1)

    def test_alunos_summary_retorna_dados_reais(self):
        self.authenticate()

        response = self.post_tool('alunos_summary')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['total'], 1)

    def test_ferramenta_inexistente_rejeitada(self):
        self.authenticate()

        response = self.post_tool('apagar_alunos')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['ok'])
        self.assertEqual(response.data['error']['code'], 'TOOL_NOT_ALLOWED')

    def test_argumentos_validos_para_ferramenta_com_filtros(self):
        self.authenticate()

        response = self.post_tool(
            'pct_results',
            {'ano_lectivo': '2026', 'turma_id': self.turma.id, 'disciplina_id': self.disciplina.id, 'trimestre': '1'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['total_resultados'], 1)

    def test_argumentos_invalidos_rejeitados(self):
        self.authenticate()

        response = self.post_tool('school_summary', {'turma_id': self.turma.id})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'INVALID_ARGUMENTS')

    def test_sql_enviado_pelo_cliente_e_rejeitado(self):
        self.authenticate()

        response = self.post_tool('pct_results', {'sql': 'select * from alunos'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'INVALID_ARGUMENTS')

    def test_codigo_enviado_pelo_cliente_e_rejeitado(self):
        self.authenticate()

        response = self.post_tool('pct_results', {'filters': {'__import__': 'os'}, 'code': 'print(1)'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error']['code'], 'INVALID_ARGUMENTS')

    def test_tentativa_de_execucao_arbitraria_nao_e_permitida(self):
        self.authenticate()

        response = self.post_tool('__import__', {'command': 'os.system'})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_recurso_nao_encontrado_retorna_404_sem_traceback(self):
        self.authenticate()

        response = self.post_tool('aluno', {'aluno_id': 99999})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error']['code'], 'NOT_FOUND')
        self.assertNotIn('traceback', str(response.data).lower())

    def test_erro_interno_nao_expoe_traceback(self):
        self.authenticate()

        with patch('assistant.gateway.execute_tool', side_effect=RuntimeError('segredo tecnico')):
            response = self.post_tool('school_summary')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error']['code'], 'INTERNAL_ERROR')
        self.assertNotIn('segredo tecnico', str(response.data))

    def test_limite_de_chamadas_retorna_429(self):
        self.authenticate()

        with patch('assistant.gateway.RATE_LIMIT_REQUESTS', 1):
            first = self.post_tool('school_summary')
            second = self.post_tool('school_summary')

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_resposta_limita_resultados(self):
        self.authenticate()
        for index in range(60):
            Aluno.objects.create(turma=self.turma, numero=index + 2, nome=f'Aluno {index}')

        response = self.post_tool('pct_results', {'ano_lectivo': '2026'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['data']['items']), 100)
