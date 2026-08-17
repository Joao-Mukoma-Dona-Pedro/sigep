from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from aulas.models import ControloAula
from disciplinas.models import Disciplina
from pct.models import PCT
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


class LecionacaoAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagogico',
        )
        self.professor = Professor.objects.create(nome='Ana Maria', email='ana@sigep.local')
        self.outro_professor = Professor.objects.create(nome='Carlos Manuel', email='carlos@sigep.local')
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
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
        )
        self.list_url = reverse('lecionacoes-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_lecionacao(self, **kwargs):
        data = {
            'professor': self.professor,
            'disciplina': self.disciplina,
            'turma': self.turma,
            'ano_lectivo': self.turma.ano_lectivo,
            'estado': Lecionacao.Estado.ATIVO,
        }
        data.update(kwargs)
        return Lecionacao.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'professor': self.professor.id,
            'disciplina': self.disciplina.id,
            'turma': self.turma.id,
            'estado': Lecionacao.Estado.ATIVO,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_lecionacoes_exigem_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_lecionacao(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lecionacao.objects.count(), 1)
        lecionacao = Lecionacao.objects.get()
        self.assertEqual(lecionacao.ano_lectivo, self.turma.ano_lectivo)
        self.assertEqual(response.data['turma_info']['horario'], 'Horário Regular')

    def test_listar_lecionacoes_com_paginacao(self):
        self.authenticate()
        self.create_lecionacao()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_lecionacao(self):
        self.authenticate()
        lecionacao = self.create_lecionacao()

        response = self.client.get(reverse('lecionacoes-detail', args=[lecionacao.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['professor_info']['nome'], self.professor.nome)
        self.assertEqual(response.data['disciplina_info']['nome'], self.disciplina.nome)
        self.assertEqual(response.data['turma_info']['classe'], self.turma.classe)

    def test_atualizar_lecionacao(self):
        self.authenticate()
        lecionacao = self.create_lecionacao()

        response = self.client.put(
            reverse('lecionacoes-detail', args=[lecionacao.id]),
            self.valid_payload(
                professor=self.outro_professor.id,
                disciplina=self.outra_disciplina.id,
                turma=self.outra_turma.id,
                observacao='Atualizada.',
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        lecionacao.refresh_from_db()
        self.assertEqual(lecionacao.professor, self.outro_professor)
        self.assertEqual(lecionacao.disciplina, self.outra_disciplina)
        self.assertEqual(lecionacao.turma, self.outra_turma)

    def test_eliminar_lecionacao_sem_dependencias(self):
        self.authenticate()
        lecionacao = self.create_lecionacao()

        response = self.client.delete(reverse('lecionacoes-detail', args=[lecionacao.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Lecionacao.objects.filter(id=lecionacao.id).exists())

    def test_validacoes_de_relacionamentos(self):
        self.authenticate()

        invalid_professor = self.client.post(self.list_url, self.valid_payload(professor=99999), format='json')
        invalid_disciplina = self.client.post(self.list_url, self.valid_payload(disciplina=99999), format='json')
        invalid_turma = self.client.post(self.list_url, self.valid_payload(turma=99999), format='json')

        self.assertEqual(invalid_professor.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_disciplina.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_turma.status_code, status.HTTP_400_BAD_REQUEST)

    def test_prevenir_lecionacao_duplicada(self):
        self.authenticate()
        self.create_lecionacao()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_nao_eliminar_lecionacao_com_pct(self):
        self.authenticate()
        lecionacao = self.create_lecionacao()
        PCT.objects.create(
            lecionacao=lecionacao,
            trimestre=PCT.Trimestre.PRIMEIRO,
            data_aplicacao='2026-03-20',
        )

        response = self.client.delete(reverse('lecionacoes-detail', args=[lecionacao.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Lecionacao.objects.filter(id=lecionacao.id).exists())

    def test_nao_eliminar_lecionacao_com_controlo_de_aula(self):
        self.authenticate()
        lecionacao = self.create_lecionacao()
        ControloAula.objects.create(
            lecionacao=lecionacao,
            data='2026-03-21',
            aula_assistida=True,
        )

        response = self.client.delete(reverse('lecionacoes-detail', args=[lecionacao.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Lecionacao.objects.filter(id=lecionacao.id).exists())
