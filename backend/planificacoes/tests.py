from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from professores.models import Professor

from .models import Planificacao


class PlanificacaoAPITests(APITestCase):
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
        self.outro_professor = Professor.objects.create(
            nome='Carlos Manuel',
            email='carlos.manuel@sigep.local',
            estado=Professor.Estado.ATIVO,
        )
        self.list_url = reverse('planificacoes-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_planificacao(self, **kwargs):
        data = {
            'professor': self.professor,
            'trimestre': Planificacao.Trimestre.PRIMEIRO,
            'data_entrega': '2026-03-20',
            'entregou': True,
            'observacao': 'Entregue dentro do prazo.',
        }
        data.update(kwargs)
        return Planificacao.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'professor': self.professor.id,
            'trimestre': Planificacao.Trimestre.SEGUNDO,
            'data_entrega': '2026-06-20',
            'entregou': True,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_planificacao(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Planificacao.objects.count(), 1)
        self.assertEqual(Planificacao.objects.get().professor, self.professor)

    def test_listar_planificacoes_com_paginacao(self):
        self.authenticate()
        self.create_planificacao()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_planificacao(self):
        self.authenticate()
        planificacao = self.create_planificacao()

        response = self.client.get(reverse('planificacoes-detail', args=[planificacao.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['trimestre'], planificacao.trimestre)
        self.assertEqual(response.data['professor_info']['nome'], self.professor.nome)

    def test_atualizar_planificacao(self):
        self.authenticate()
        planificacao = self.create_planificacao()

        response = self.client.put(
            reverse('planificacoes-detail', args=[planificacao.id]),
            self.valid_payload(
                professor=self.outro_professor.id,
                trimestre=Planificacao.Trimestre.TERCEIRO,
                entregou=False,
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        planificacao.refresh_from_db()
        self.assertEqual(planificacao.professor, self.outro_professor)
        self.assertEqual(planificacao.trimestre, Planificacao.Trimestre.TERCEIRO)
        self.assertFalse(planificacao.entregou)

    def test_atualizar_planificacao_parcialmente(self):
        self.authenticate()
        planificacao = self.create_planificacao(entregou=False)

        response = self.client.patch(
            reverse('planificacoes-detail', args=[planificacao.id]),
            {'entregou': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        planificacao.refresh_from_db()
        self.assertTrue(planificacao.entregou)

    def test_eliminar_planificacao(self):
        self.authenticate()
        planificacao = self.create_planificacao()

        response = self.client.delete(reverse('planificacoes-detail', args=[planificacao.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Planificacao.objects.filter(id=planificacao.id).exists())

    def test_validacao_professor_obrigatorio(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('professor')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('professor', response.data)

    def test_validacao_professor_inexistente(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(professor=99999),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('professor', response.data)

    def test_validacao_trimestre_invalido(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(trimestre='4'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('trimestre', response.data)

    def test_filtro_por_professor(self):
        self.authenticate()
        self.create_planificacao(professor=self.professor)
        self.create_planificacao(professor=self.outro_professor)

        response = self.client.get(self.list_url, {'professor': self.professor.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['professor'], self.professor.id)

    def test_filtro_por_trimestre_e_entregou(self):
        self.authenticate()
        self.create_planificacao(trimestre=Planificacao.Trimestre.PRIMEIRO, entregou=True)
        self.create_planificacao(trimestre=Planificacao.Trimestre.SEGUNDO, entregou=False)

        response = self.client.get(
            self.list_url,
            {'trimestre': Planificacao.Trimestre.SEGUNDO, 'entregou': 'false'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['trimestre'], Planificacao.Trimestre.SEGUNDO)

    def test_filtro_por_periodo_data_entrega(self):
        self.authenticate()
        self.create_planificacao(data_entrega='2026-03-20')
        self.create_planificacao(professor=self.outro_professor, data_entrega='2026-09-20')

        response = self.client.get(
            self.list_url,
            {'data_inicio': '2026-09-01', 'data_fim': '2026-09-30'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['data_entrega'], '2026-09-20')
