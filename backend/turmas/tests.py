from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from professores.models import Professor

from .models import Turma


class TurmaAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagogico',
        )
        self.professor = Professor.objects.create(
            nome='Ana Maria',
            email='ana.maria@sigep.local',
            estado=Professor.Estado.ATIVO,
        )
        self.list_url = reverse('turmas-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_turma(self, **kwargs):
        data = {
            'classe': '10',
            'sala': 'A',
            'periodo': Turma.Periodo.MANHA,
            'ano_lectivo': '2026',
            'turno': 'Primeiro',
            'capacidade': 35,
            'diretor_turma': self.professor,
            'estado': Turma.Estado.ATIVO,
            'observacao': 'Turma de referencia.',
        }
        data.update(kwargs)
        return Turma.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'classe': '11',
            'sala': 'B',
            'periodo': Turma.Periodo.TARDE,
            'ano_lectivo': '2026',
            'turno': 'Segundo',
            'capacidade': 40,
            'diretor_turma': self.professor.id,
            'estado': Turma.Estado.ATIVO,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_turma(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Turma.objects.count(), 1)
        self.assertEqual(Turma.objects.get().diretor_turma, self.professor)

    def test_listar_turmas_com_paginacao(self):
        self.authenticate()
        self.create_turma()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_turma(self):
        self.authenticate()
        turma = self.create_turma()

        response = self.client.get(reverse('turmas-detail', args=[turma.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['classe'], turma.classe)
        self.assertEqual(response.data['diretor_turma_info']['nome'], self.professor.nome)

    def test_atualizar_turma(self):
        self.authenticate()
        turma = self.create_turma()

        response = self.client.put(
            reverse('turmas-detail', args=[turma.id]),
            self.valid_payload(classe='12', sala='C', estado=Turma.Estado.INATIVO),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        turma.refresh_from_db()
        self.assertEqual(turma.classe, '12')
        self.assertEqual(turma.estado, Turma.Estado.INATIVO)

    def test_atualizar_turma_parcialmente(self):
        self.authenticate()
        turma = self.create_turma()

        response = self.client.patch(
            reverse('turmas-detail', args=[turma.id]),
            {'capacidade': 42},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        turma.refresh_from_db()
        self.assertEqual(turma.capacidade, 42)

    def test_eliminar_turma_sem_relacoes(self):
        self.authenticate()
        turma = self.create_turma()

        response = self.client.delete(reverse('turmas-detail', args=[turma.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Turma.objects.filter(id=turma.id).exists())

    def test_nao_eliminar_turma_com_alunos(self):
        self.authenticate()
        turma = self.create_turma()
        Aluno.objects.create(turma=turma, numero=1, nome='Aluno Teste')

        response = self.client.delete(reverse('turmas-detail', args=[turma.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Turma.objects.filter(id=turma.id).exists())

    def test_validacao_campos_obrigatorios(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(classe=' ', sala=' ', ano_lectivo=' '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('classe', response.data)
        self.assertIn('sala', response.data)
        self.assertIn('ano_lectivo', response.data)

    def test_validacao_capacidade_invalida(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(capacidade=0),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacidade', response.data)

    def test_validacao_ano_lectivo_invalido(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(ano_lectivo='ano atual'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ano_lectivo', response.data)

    def test_validacao_diretor_turma_inexistente(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(diretor_turma=99999),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('diretor_turma', response.data)
