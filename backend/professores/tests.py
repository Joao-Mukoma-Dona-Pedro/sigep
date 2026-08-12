from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from disciplinas.models import Disciplina
from turmas.models import Turma

from .models import Lecionacao, Professor


class ProfessorAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagogico',
        )
        self.list_url = reverse('professores-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_professor(self, **kwargs):
        data = {
            'nome': 'Ana Maria',
            'telefone': '923000111',
            'email': 'ana.maria@sigep.local',
            'data_entrada': '2026-01-15',
            'estado': Professor.Estado.ATIVO,
            'observacao': 'Professora de referencia.',
        }
        data.update(kwargs)
        return Professor.objects.create(**data)

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_professor(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            {
                'nome': 'Carlos Manuel',
                'telefone': '923000222',
                'email': 'carlos.manuel@sigep.local',
                'data_entrada': '2026-02-01',
                'estado': Professor.Estado.ATIVO,
                'observacao': '',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Professor.objects.count(), 1)
        self.assertEqual(Professor.objects.get().nome, 'Carlos Manuel')

    def test_listar_professores_com_paginacao(self):
        self.authenticate()
        self.create_professor()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_professor(self):
        self.authenticate()
        professor = self.create_professor()

        response = self.client.get(reverse('professores-detail', args=[professor.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], professor.nome)

    def test_atualizar_professor(self):
        self.authenticate()
        professor = self.create_professor()

        response = self.client.put(
            reverse('professores-detail', args=[professor.id]),
            {
                'nome': 'Ana Maria Atualizada',
                'telefone': '923000333',
                'email': 'ana.atualizada@sigep.local',
                'data_entrada': '2026-01-15',
                'estado': Professor.Estado.INATIVO,
                'observacao': 'Atualizacao administrativa.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        professor.refresh_from_db()
        self.assertEqual(professor.nome, 'Ana Maria Atualizada')
        self.assertEqual(professor.estado, Professor.Estado.INATIVO)

    def test_atualizar_professor_parcialmente(self):
        self.authenticate()
        professor = self.create_professor()

        response = self.client.patch(
            reverse('professores-detail', args=[professor.id]),
            {'telefone': '923999000'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        professor.refresh_from_db()
        self.assertEqual(professor.telefone, '923999000')

    def test_eliminar_professor_sem_relacoes(self):
        self.authenticate()
        professor = self.create_professor()

        response = self.client.delete(reverse('professores-detail', args=[professor.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Professor.objects.filter(id=professor.id).exists())

    def test_nao_eliminar_professor_com_lecionacao(self):
        self.authenticate()
        professor = self.create_professor()
        disciplina = Disciplina.objects.create(nome='Matematica')
        turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
        )
        Lecionacao.objects.create(
            professor=professor,
            disciplina=disciplina,
            turma=turma,
            ano_lectivo='2026',
        )

        response = self.client.delete(reverse('professores-detail', args=[professor.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Professor.objects.filter(id=professor.id).exists())

    def test_validacao_nome_obrigatorio(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            {'nome': '   ', 'estado': Professor.Estado.ATIVO},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nome', response.data)
