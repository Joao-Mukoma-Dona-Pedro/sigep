from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from disciplinas.models import Disciplina
from professores.models import Lecionacao, Professor
from turmas.models import Turma

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
        self.disciplina = Disciplina.objects.create(nome='Matematica', codigo='MAT')
        self.outra_disciplina = Disciplina.objects.create(nome='Fisica', codigo='FIS')
        self.turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            turno='Regular',
            capacidade=30,
            diretor_turma=self.professor,
            estado=Turma.Estado.ATIVO,
        )
        self.outra_turma = Turma.objects.create(
            classe='11',
            sala='B',
            periodo=Turma.Periodo.TARDE,
            ano_lectivo='2026',
            turno='Regular',
            capacidade=28,
            diretor_turma=self.outro_professor,
            estado=Turma.Estado.ATIVO,
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
        self.list_url = reverse('planificacoes-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_planificacao(self, **kwargs):
        data = {
            'lecionacao': self.lecionacao,
            'trimestre': Planificacao.Trimestre.PRIMEIRO,
            'data_entrega': '2026-03-20',
            'entregou': True,
            'observacao': 'Entregue dentro do prazo.',
        }
        data.update(kwargs)
        return Planificacao.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'lecionacao': self.lecionacao.id,
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

    def test_criar_planificacao_com_lecionacao(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Planificacao.objects.count(), 1)
        self.assertEqual(Planificacao.objects.get().lecionacao, self.lecionacao)

    def test_rejeita_planificacao_sem_lecionacao(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('lecionacao')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lecionacao', response.data)

    def test_rejeita_lecionacao_inexistente(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(lecionacao=99999),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lecionacao', response.data)

    def test_dados_contextuais_sao_derivados_da_lecionacao(self):
        self.authenticate()
        planificacao = self.create_planificacao()

        response = self.client.get(reverse('planificacoes-detail', args=[planificacao.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['professor'], self.professor.nome)
        self.assertEqual(response.data['disciplina'], self.disciplina.nome)
        self.assertEqual(response.data['turma'], str(self.turma))
        self.assertEqual(response.data['ano_lectivo'], self.lecionacao.ano_lectivo)
        self.assertEqual(response.data['lecionacao_info']['professor_id'], self.professor.id)

    def test_listar_planificacoes_com_paginacao(self):
        self.authenticate()
        self.create_planificacao()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_atualizar_planificacao(self):
        self.authenticate()
        planificacao = self.create_planificacao()

        response = self.client.put(
            reverse('planificacoes-detail', args=[planificacao.id]),
            self.valid_payload(
                lecionacao=self.outra_lecionacao.id,
                trimestre=Planificacao.Trimestre.TERCEIRO,
                entregou=False,
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        planificacao.refresh_from_db()
        self.assertEqual(planificacao.lecionacao, self.outra_lecionacao)
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

    def test_validacao_trimestre_invalido(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(trimestre='4'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('trimestre', response.data)

    def test_filtro_por_professor_disciplina_turma_e_ano_lectivo(self):
        self.authenticate()
        self.create_planificacao(lecionacao=self.lecionacao)
        self.create_planificacao(lecionacao=self.outra_lecionacao)

        response = self.client.get(
            self.list_url,
            {
                'professor': self.professor.id,
                'disciplina': self.disciplina.id,
                'turma': self.turma.id,
                'ano_lectivo': '2026',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['lecionacao'], self.lecionacao.id)

    def test_filtro_por_trimestre_e_entregou(self):
        self.authenticate()
        self.create_planificacao(trimestre=Planificacao.Trimestre.PRIMEIRO, entregou=True)
        self.create_planificacao(
            lecionacao=self.outra_lecionacao,
            trimestre=Planificacao.Trimestre.SEGUNDO,
            entregou=False,
        )

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
        self.create_planificacao(lecionacao=self.outra_lecionacao, data_entrega='2026-09-20')

        response = self.client.get(
            self.list_url,
            {'data_inicio': '2026-09-01', 'data_fim': '2026-09-30'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['data_entrega'], '2026-09-20')

    def test_pesquisa_por_dados_da_lecionacao(self):
        self.authenticate()
        self.create_planificacao()

        response = self.client.get(self.list_url, {'search': self.disciplina.nome})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_endpoint_lecionacoes_para_formulario(self):
        self.authenticate()

        response = self.client.get(reverse('planificacoes-lecionacoes'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['professor'], self.professor.nome)
