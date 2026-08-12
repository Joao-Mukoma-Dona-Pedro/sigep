from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from turmas.models import Turma

from .models import Aluno


class AlunoAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagogico',
        )
        self.turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            estado=Turma.Estado.ATIVO,
        )
        self.outra_turma = Turma.objects.create(
            classe='11',
            sala='B',
            periodo=Turma.Periodo.TARDE,
            ano_lectivo='2026',
            estado=Turma.Estado.ATIVO,
        )
        self.list_url = reverse('alunos-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_aluno(self, **kwargs):
        data = {
            'turma': self.turma,
            'numero': 1,
            'nome': 'Maria Jose',
            'data_nascimento': '2010-05-12',
            'sexo': Aluno.Sexo.FEMININO,
            'encarregado_educacao': 'Jose Manuel',
            'telefone_encarregado': '923000111',
            'estado': Aluno.Estado.ATIVO,
            'observacao': 'Aluno de referencia.',
        }
        data.update(kwargs)
        return Aluno.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'turma': self.turma.id,
            'numero': 2,
            'nome': 'Carlos Antonio',
            'data_nascimento': '2011-03-20',
            'sexo': Aluno.Sexo.MASCULINO,
            'encarregado_educacao': 'Antonio Paulo',
            'telefone_encarregado': '923000222',
            'estado': Aluno.Estado.ATIVO,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_aluno(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Aluno.objects.count(), 1)
        self.assertEqual(Aluno.objects.get().turma, self.turma)

    def test_listar_alunos_com_paginacao(self):
        self.authenticate()
        self.create_aluno()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_aluno(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.get(reverse('alunos-detail', args=[aluno.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], aluno.nome)
        self.assertEqual(response.data['turma_info']['classe'], self.turma.classe)
        self.assertEqual(response.data['turma_info']['sala'], self.turma.sala)

    def test_atualizar_aluno(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.put(
            reverse('alunos-detail', args=[aluno.id]),
            self.valid_payload(nome='Carlos Antonio Atualizado', turma=self.outra_turma.id),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        aluno.refresh_from_db()
        self.assertEqual(aluno.nome, 'Carlos Antonio Atualizado')
        self.assertEqual(aluno.turma, self.outra_turma)

    def test_atualizar_aluno_parcialmente(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.patch(
            reverse('alunos-detail', args=[aluno.id]),
            {'telefone_encarregado': '923999000'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        aluno.refresh_from_db()
        self.assertEqual(aluno.telefone_encarregado, '923999000')

    def test_eliminar_aluno(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.delete(reverse('alunos-detail', args=[aluno.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Aluno.objects.filter(id=aluno.id).exists())

    def test_validacao_nome_obrigatorio(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(nome='   '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nome', response.data)

    def test_validacao_turma_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('turma')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('turma', response.data)

    def test_numero_opcional(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(numero=None),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(Aluno.objects.get().numero)

    def test_numero_unico_dentro_da_turma(self):
        self.authenticate()
        self.create_aluno(numero=7)

        response = self.client.post(
            self.list_url,
            self.valid_payload(numero=7),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_mesmo_numero_em_turmas_diferentes(self):
        self.authenticate()
        self.create_aluno(numero=9, turma=self.turma)

        response = self.client.post(
            self.list_url,
            self.valid_payload(numero=9, turma=self.outra_turma.id),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Aluno.objects.filter(numero=9).count(), 2)

    def test_validacao_turma_inexistente(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(turma=99999),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('turma', response.data)
