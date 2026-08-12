from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from disciplinas.models import Disciplina
from professores.models import Lecionacao, Professor
from turmas.models import Turma

from .models import ControloAula


class ControloAulaAPITests(APITestCase):
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
        self.list_url = reverse('controlo-aulas-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_controlo(self, **kwargs):
        data = {
            'lecionacao': self.lecionacao,
            'data': '2026-03-20',
            'aula_assistida': True,
            'observacao': 'Aula assistida pela direcao pedagogica.',
        }
        data.update(kwargs)
        return ControloAula.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'lecionacao': self.lecionacao.id,
            'data': '2026-03-20',
            'aula_assistida': True,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_controlo_aula(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ControloAula.objects.count(), 1)
        self.assertEqual(ControloAula.objects.get().lecionacao, self.lecionacao)

    def test_listar_controlo_aulas_com_paginacao(self):
        self.authenticate()
        self.create_controlo()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_controlo_aula(self):
        self.authenticate()
        controlo = self.create_controlo()

        response = self.client.get(reverse('controlo-aulas-detail', args=[controlo.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['lecionacao'], self.lecionacao.id)
        self.assertEqual(response.data['lecionacao_info']['professor'], self.professor.nome)
        self.assertEqual(response.data['lecionacao_info']['disciplina'], self.disciplina.nome)
        self.assertEqual(response.data['lecionacao_info']['turma_classe'], self.turma.classe)

    def test_atualizar_controlo_aula(self):
        self.authenticate()
        controlo = self.create_controlo()

        response = self.client.put(
            reverse('controlo-aulas-detail', args=[controlo.id]),
            self.valid_payload(
                lecionacao=self.outra_lecionacao.id,
                data='2026-04-10',
                aula_assistida=False,
                observacao='Aula nao assistida.',
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        controlo.refresh_from_db()
        self.assertEqual(controlo.lecionacao, self.outra_lecionacao)
        self.assertFalse(controlo.aula_assistida)

    def test_atualizar_controlo_aula_parcialmente(self):
        self.authenticate()
        controlo = self.create_controlo(aula_assistida=False)

        response = self.client.patch(
            reverse('controlo-aulas-detail', args=[controlo.id]),
            {'aula_assistida': True},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        controlo.refresh_from_db()
        self.assertTrue(controlo.aula_assistida)

    def test_eliminar_controlo_aula(self):
        self.authenticate()
        controlo = self.create_controlo()

        response = self.client.delete(reverse('controlo-aulas-detail', args=[controlo.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ControloAula.objects.filter(id=controlo.id).exists())
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

    def test_validacao_data_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('data')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data', response.data)

    def test_aula_assistida_false(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(aula_assistida=False),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(ControloAula.objects.get().aula_assistida)

    def test_filtros(self):
        self.authenticate()
        self.create_controlo(aula_assistida=True, data='2026-03-20')
        self.create_controlo(
            lecionacao=self.outra_lecionacao,
            aula_assistida=False,
            data='2026-04-10',
        )

        response = self.client.get(
            self.list_url,
            {
                'professor': self.outro_professor.id,
                'disciplina': self.outra_disciplina.id,
                'turma': self.outra_turma.id,
                'ano_lectivo': '2026',
                'data': '2026-04-10',
                'aula_assistida': 'false',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['lecionacao'], self.outra_lecionacao.id)

    def test_listar_lecionacoes_para_formulario(self):
        self.authenticate()

        response = self.client.get(reverse('controlo-aulas-lecionacoes'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['ano_lectivo'], '2026')
