from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from disciplinas.models import Disciplina
from professores.models import Lecionacao, Professor
from turmas.models import Turma

from .models import PCT


class PCTAPITests(APITestCase):
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
        self.disciplina = Disciplina.objects.create(nome='Matematica')
        self.outra_disciplina = Disciplina.objects.create(nome='Biologia')
        self.turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
        )
        self.outra_turma = Turma.objects.create(
            classe='11',
            sala='B',
            periodo=Turma.Periodo.TARDE,
            ano_lectivo='2026',
        )
        self.lecionacao = Lecionacao.objects.create(
            professor=self.professor,
            disciplina=self.disciplina,
            turma=self.turma,
            ano_lectivo='2026',
        )
        self.outra_lecionacao = Lecionacao.objects.create(
            professor=self.outro_professor,
            disciplina=self.outra_disciplina,
            turma=self.outra_turma,
            ano_lectivo='2026',
        )
        self.list_url = reverse('pct-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_pct(self, **kwargs):
        data = {
            'lecionacao': self.lecionacao,
            'trimestre': PCT.Trimestre.PRIMEIRO,
            'data_aplicacao': '2026-03-20',
            'nota_lancada': True,
            'observacao': 'PCT aplicada.',
        }
        data.update(kwargs)
        return PCT.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'lecionacao': self.lecionacao.id,
            'trimestre': PCT.Trimestre.PRIMEIRO,
            'data_aplicacao': '2026-03-20',
            'nota_lancada': True,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_pct(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PCT.objects.count(), 1)
        self.assertEqual(PCT.objects.get().lecionacao, self.lecionacao)

    def test_listar_pct_com_paginacao(self):
        self.authenticate()
        self.create_pct()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_pct(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.get(reverse('pct-detail', args=[pct.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['lecionacao'], self.lecionacao.id)
        self.assertEqual(response.data['lecionacao_info']['professor'], self.professor.nome)
        self.assertEqual(response.data['lecionacao_info']['disciplina'], self.disciplina.nome)
        self.assertEqual(response.data['lecionacao_info']['turma_classe'], self.turma.classe)

    def test_atualizar_pct(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.put(
            reverse('pct-detail', args=[pct.id]),
            self.valid_payload(
                lecionacao=self.outra_lecionacao.id,
                trimestre=PCT.Trimestre.SEGUNDO,
                data_aplicacao='2026-06-20',
                nota_lancada=False,
                observacao='PCT do segundo trimestre.',
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pct.refresh_from_db()
        self.assertEqual(pct.lecionacao, self.outra_lecionacao)
        self.assertEqual(pct.trimestre, PCT.Trimestre.SEGUNDO)
        self.assertFalse(pct.nota_lancada)

    def test_atualizar_pct_parcialmente(self):
        self.authenticate()
        pct = self.create_pct(nota_lancada=False)

        response = self.client.patch(
            reverse('pct-detail', args=[pct.id]),
            {'nota_lancada': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        pct.refresh_from_db()
        self.assertTrue(pct.nota_lancada)

    def test_eliminar_pct(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.delete(reverse('pct-detail', args=[pct.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PCT.objects.filter(id=pct.id).exists())
        self.assertTrue(Lecionacao.objects.filter(id=self.lecionacao.id).exists())

    def test_validacao_lecionacao_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('lecionacao')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lecionacao', response.data)

    def test_validacao_lecionacao_inexistente(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(lecionacao=99999),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lecionacao', response.data)

    def test_validacao_trimestre_invalido(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(trimestre='4'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('trimestre', response.data)

    def test_validacao_data_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('data_aplicacao')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_aplicacao', response.data)

    def test_nota_lancada_false(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(nota_lancada=False),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(PCT.objects.get().nota_lancada)

    def test_unique_lecionacao_trimestre(self):
        self.authenticate()
        self.create_pct(trimestre=PCT.Trimestre.PRIMEIRO)

        response = self.client.post(
            self.list_url,
            self.valid_payload(trimestre=PCT.Trimestre.PRIMEIRO),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_filtros(self):
        self.authenticate()
        self.create_pct(trimestre=PCT.Trimestre.PRIMEIRO, nota_lancada=True, data_aplicacao='2026-03-20')
        self.create_pct(
            lecionacao=self.outra_lecionacao,
            trimestre=PCT.Trimestre.SEGUNDO,
            nota_lancada=False,
            data_aplicacao='2026-06-20',
        )

        response = self.client.get(
            self.list_url,
            {
                'professor': self.outro_professor.id,
                'disciplina': self.outra_disciplina.id,
                'turma': self.outra_turma.id,
                'ano_lectivo': '2026',
                'trimestre': PCT.Trimestre.SEGUNDO,
                'nota_lancada': 'false',
                'data_aplicacao': '2026-06-20',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['lecionacao'], self.outra_lecionacao.id)

    def test_listar_lecionacoes_para_formulario(self):
        self.authenticate()

        response = self.client.get(reverse('pct-lecionacoes'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['ano_lectivo'], '2026')
