from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from disciplinas.models import Disciplina
from professores.models import Professor
from turmas.models import Turma


class DashboardSummaryTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdirector Pedagógico',
        )
        self.url = reverse('dashboard-resumo')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def test_dashboard_exige_autenticacao(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_retorna_zero_sem_dados(self):
        self.authenticate()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = {item['label']: item['value'] for item in response.data['stats']}
        self.assertEqual(stats['Total de Professores'], 0)
        self.assertEqual(stats['Total de Disciplinas'], 0)
        self.assertEqual(stats['Total de Turmas'], 0)
        self.assertEqual(stats['Total de Alunos'], 0)
        self.assertEqual(response.data['activities'], [])

    def test_dashboard_retorna_contagens_reais(self):
        professor = Professor.objects.create(nome='Ana Maria')
        Disciplina.objects.create(nome='Matemática')
        turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            turno='Regular',
            diretor_turma=professor,
        )
        Aluno.objects.create(turma=turma, nome='Carlos Pedro')
        self.authenticate()

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        stats = {item['label']: item['value'] for item in response.data['stats']}
        self.assertEqual(stats['Total de Professores'], 1)
        self.assertEqual(stats['Total de Disciplinas'], 1)
        self.assertEqual(stats['Total de Turmas'], 1)
        self.assertEqual(stats['Total de Alunos'], 1)
        self.assertTrue(response.data['activities'])
