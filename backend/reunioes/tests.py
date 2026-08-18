from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Reuniao


class ReuniaoAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagógico',
        )
        self.list_url = reverse('reunioes-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_reuniao(self, **kwargs):
        data = {
            'data': '2026-03-15',
            'assunto': 'Acompanhamento pedagógico do trimestre',
            'participantes': 'Diretor Pedagógico; Coordenadores; Professores',
            'decisoes': 'Reforçar o acompanhamento das planificações.',
            'observacao': 'Registo administrativo.',
        }
        data.update(kwargs)
        return Reuniao.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'data': '2026-04-20',
            'assunto': 'Preparação das PCT',
            'participantes': 'Direção Pedagógica; Professores da 10.ª classe',
            'decisoes': 'Confirmar disciplinas e datas das provas.',
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_reuniao(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reuniao.objects.count(), 1)
        self.assertEqual(Reuniao.objects.get().assunto, 'Preparação das PCT')

    def test_listar_reunioes(self):
        self.authenticate()
        self.create_reuniao()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['assunto'], 'Acompanhamento pedagógico do trimestre')

    def test_listar_reunioes_com_paginacao(self):
        self.authenticate()
        for index in range(12):
            self.create_reuniao(assunto=f'Reunião pedagógica {index}', data='2026-03-15')

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 12)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIsNotNone(response.data['next'])

    def test_consultar_reuniao(self):
        self.authenticate()
        reuniao = self.create_reuniao()

        response = self.client.get(reverse('reunioes-detail', args=[reuniao.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['assunto'], reuniao.assunto)
        self.assertEqual(response.data['participantes'], reuniao.participantes)

    def test_atualizar_reuniao(self):
        self.authenticate()
        reuniao = self.create_reuniao()

        response = self.client.put(
            reverse('reunioes-detail', args=[reuniao.id]),
            self.valid_payload(assunto='Revisão das planificações'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reuniao.refresh_from_db()
        self.assertEqual(reuniao.assunto, 'Revisão das planificações')

    def test_atualizar_reuniao_parcialmente(self):
        self.authenticate()
        reuniao = self.create_reuniao()

        response = self.client.patch(
            reverse('reunioes-detail', args=[reuniao.id]),
            {'decisoes': 'Acompanhar professores com planificações pendentes.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reuniao.refresh_from_db()
        self.assertEqual(reuniao.decisoes, 'Acompanhar professores com planificações pendentes.')

    def test_eliminar_reuniao(self):
        self.authenticate()
        reuniao = self.create_reuniao()

        response = self.client.delete(reverse('reunioes-detail', args=[reuniao.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Reuniao.objects.filter(id=reuniao.id).exists())

    def test_validacao_data_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('data')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data', response.data)

    def test_validacao_assunto_obrigatorio(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(assunto=' '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assunto', response.data)

    def test_pesquisar_reunioes(self):
        self.authenticate()
        self.create_reuniao(assunto='Preparação das PCT')
        self.create_reuniao(assunto='Acompanhamento de ocorrências')

        response = self.client.get(self.list_url, {'search': 'PCT'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['assunto'], 'Preparação das PCT')

    def test_filtrar_reunioes_por_data(self):
        self.authenticate()
        self.create_reuniao(data='2026-03-15')
        self.create_reuniao(data='2026-04-20', assunto='Outra reunião')

        response = self.client.get(self.list_url, {'data': '2026-04-20'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['data'], '2026-04-20')
