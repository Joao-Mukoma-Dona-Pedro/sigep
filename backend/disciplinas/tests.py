from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from professores.models import Lecionacao, Professor
from turmas.models import Turma

from .models import Disciplina


class DisciplinaAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagógico',
        )
        self.list_url = reverse('disciplinas-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_disciplina(self, **kwargs):
        data = {
            'nome': 'Matemática',
            'codigo': 'MAT',
            'estado': Disciplina.Estado.ATIVO,
            'observacao': 'Disciplina curricular.',
        }
        data.update(kwargs)
        return Disciplina.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'nome': 'Língua Portuguesa',
            'codigo': 'LP',
            'estado': Disciplina.Estado.ATIVO,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_disciplina(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Disciplina.objects.count(), 1)
        self.assertEqual(Disciplina.objects.get().codigo, 'LP')

    def test_listar_disciplinas_com_paginacao(self):
        self.authenticate()
        self.create_disciplina()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_disciplina(self):
        self.authenticate()
        disciplina = self.create_disciplina()

        response = self.client.get(reverse('disciplinas-detail', args=[disciplina.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], disciplina.nome)
        self.assertEqual(response.data['codigo'], disciplina.codigo)

    def test_atualizar_disciplina(self):
        self.authenticate()
        disciplina = self.create_disciplina()

        response = self.client.put(
            reverse('disciplinas-detail', args=[disciplina.id]),
            self.valid_payload(nome='Biologia', codigo='BIO', estado=Disciplina.Estado.INATIVO),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        disciplina.refresh_from_db()
        self.assertEqual(disciplina.nome, 'Biologia')
        self.assertEqual(disciplina.codigo, 'BIO')
        self.assertEqual(disciplina.estado, Disciplina.Estado.INATIVO)

    def test_atualizar_disciplina_parcialmente(self):
        self.authenticate()
        disciplina = self.create_disciplina()

        response = self.client.patch(
            reverse('disciplinas-detail', args=[disciplina.id]),
            {'observacao': 'Atualizada.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        disciplina.refresh_from_db()
        self.assertEqual(disciplina.observacao, 'Atualizada.')

    def test_eliminar_disciplina_sem_relacoes(self):
        self.authenticate()
        disciplina = self.create_disciplina()

        response = self.client.delete(reverse('disciplinas-detail', args=[disciplina.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Disciplina.objects.filter(id=disciplina.id).exists())

    def test_validacao_nome_obrigatorio(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(nome=' '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nome', response.data)

    def test_prevenir_disciplina_duplicada_por_nome(self):
        self.authenticate()
        self.create_disciplina(nome='Matemática', codigo='MAT')

        response = self.client.post(
            self.list_url,
            self.valid_payload(nome=' matemática ', codigo='MAT2'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nome', response.data)

    def test_prevenir_disciplina_duplicada_por_codigo(self):
        self.authenticate()
        self.create_disciplina(nome='Matemática', codigo='MAT')

        response = self.client.post(
            self.list_url,
            self.valid_payload(nome='Física', codigo=' mat '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('codigo', response.data)

    def test_codigo_opcional(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(codigo=''),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(Disciplina.objects.get().codigo)

    def test_nao_eliminar_disciplina_com_lecionacao(self):
        self.authenticate()
        disciplina = self.create_disciplina()
        professor = Professor.objects.create(nome='Ana Maria', estado=Professor.Estado.ATIVO)
        turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            turno='Regular',
            capacidade=35,
            estado=Turma.Estado.ATIVO,
        )
        Lecionacao.objects.create(
            professor=professor,
            disciplina=disciplina,
            turma=turma,
            ano_lectivo=turma.ano_lectivo,
        )

        response = self.client.delete(reverse('disciplinas-detail', args=[disciplina.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Disciplina.objects.filter(id=disciplina.id).exists())
