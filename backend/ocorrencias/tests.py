from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from professores.models import Professor
from tipos_ocorrencias.models import TipoOcorrencia
from turmas.models import Turma

from .models import Ocorrencia


class OcorrenciaAPITests(APITestCase):
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
        self.aluno = Aluno.objects.create(turma=self.turma, numero=1, nome='Maria Jose')
        self.outro_aluno = Aluno.objects.create(turma=self.outra_turma, numero=2, nome='Carlos Antonio')
        self.tipo = TipoOcorrencia.objects.create(
            descricao='Indisciplina',
            categoria=TipoOcorrencia.Categoria.DISCIPLINAR,
        )
        self.outro_tipo = TipoOcorrencia.objects.create(
            descricao='Baixo aproveitamento',
            categoria=TipoOcorrencia.Categoria.ACADEMICA,
        )
        self.list_url = reverse('ocorrencias-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_ocorrencia(self, **kwargs):
        data = {
            'aluno': self.aluno,
            'tipo': self.tipo,
            'data_ocorrencia': '2026-03-20',
            'descricao': 'Aluno apresentou comportamento inadequado.',
            'medida_tomada': 'Conversa pedagogica.',
            'registada_por': self.professor,
            'observacao': 'Acompanhar evolucao.',
        }
        data.update(kwargs)
        return Ocorrencia.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'aluno': self.aluno.id,
            'tipo': self.tipo.id,
            'data_ocorrencia': '2026-03-20',
            'descricao': 'Aluno apresentou comportamento inadequado.',
            'medida_tomada': 'Conversa pedagogica.',
            'registada_por': self.professor.id,
            'observacao': 'Acompanhar evolucao.',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_ocorrencia(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Ocorrencia.objects.count(), 1)
        self.assertEqual(Ocorrencia.objects.get().aluno, self.aluno)

    def test_listar_ocorrencias_com_paginacao(self):
        self.authenticate()
        self.create_ocorrencia()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_ocorrencia(self):
        self.authenticate()
        ocorrencia = self.create_ocorrencia()

        response = self.client.get(reverse('ocorrencias-detail', args=[ocorrencia.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['aluno'], self.aluno.id)
        self.assertEqual(response.data['aluno_info']['nome'], self.aluno.nome)
        self.assertEqual(response.data['aluno_info']['classe'], self.turma.classe)
        self.assertEqual(response.data['tipo_info']['categoria'], self.tipo.categoria)
        self.assertEqual(response.data['registada_por_info']['nome'], self.professor.nome)

    def test_atualizar_ocorrencia(self):
        self.authenticate()
        ocorrencia = self.create_ocorrencia()

        response = self.client.put(
            reverse('ocorrencias-detail', args=[ocorrencia.id]),
            self.valid_payload(
                aluno=self.outro_aluno.id,
                tipo=self.outro_tipo.id,
                data_ocorrencia='2026-04-10',
                descricao='Baixo rendimento persistente.',
                registada_por=self.outro_professor.id,
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ocorrencia.refresh_from_db()
        self.assertEqual(ocorrencia.aluno, self.outro_aluno)
        self.assertEqual(ocorrencia.tipo, self.outro_tipo)
        self.assertEqual(ocorrencia.registada_por, self.outro_professor)

    def test_atualizar_ocorrencia_parcialmente(self):
        self.authenticate()
        ocorrencia = self.create_ocorrencia()

        response = self.client.patch(
            reverse('ocorrencias-detail', args=[ocorrencia.id]),
            {'medida_tomada': 'Encaminhamento ao gabinete pedagogico.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ocorrencia.refresh_from_db()
        self.assertEqual(ocorrencia.medida_tomada, 'Encaminhamento ao gabinete pedagogico.')

    def test_eliminar_ocorrencia(self):
        self.authenticate()
        ocorrencia = self.create_ocorrencia()

        response = self.client.delete(reverse('ocorrencias-detail', args=[ocorrencia.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Ocorrencia.objects.filter(id=ocorrencia.id).exists())
        self.assertTrue(Aluno.objects.filter(id=self.aluno.id).exists())
        self.assertTrue(TipoOcorrencia.objects.filter(id=self.tipo.id).exists())
        self.assertTrue(Professor.objects.filter(id=self.professor.id).exists())

    def test_aluno_obrigatorio(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('aluno')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('aluno', response.data)

    def test_tipo_obrigatorio(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('tipo')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tipo', response.data)

    def test_data_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('data_ocorrencia')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data_ocorrencia', response.data)

    def test_descricao_obrigatoria(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(descricao='   '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('descricao', response.data)

    def test_professor_obrigatorio(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('registada_por')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('registada_por', response.data)

    def test_medida_tomada_e_observacao_opcionais(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(medida_tomada='', observacao=''),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ocorrencia = Ocorrencia.objects.get()
        self.assertEqual(ocorrencia.medida_tomada, '')
        self.assertEqual(ocorrencia.observacao, '')

    def test_filtros(self):
        self.authenticate()
        self.create_ocorrencia(data_ocorrencia='2026-03-20')
        self.create_ocorrencia(
            aluno=self.outro_aluno,
            tipo=self.outro_tipo,
            data_ocorrencia='2026-04-10',
            registada_por=self.outro_professor,
        )

        response = self.client.get(
            self.list_url,
            {
                'aluno': self.outro_aluno.id,
                'turma': self.outra_turma.id,
                'tipo': self.outro_tipo.id,
                'categoria': TipoOcorrencia.Categoria.ACADEMICA,
                'registada_por': self.outro_professor.id,
                'data_inicio': '2026-04-01',
                'data_fim': '2026-04-30',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['aluno'], self.outro_aluno.id)

    def test_endpoints_auxiliares(self):
        self.authenticate()

        alunos = self.client.get(reverse('ocorrencias-alunos'))
        tipos = self.client.get(reverse('ocorrencias-tipos'))
        professores = self.client.get(reverse('ocorrencias-professores'))

        self.assertEqual(alunos.status_code, status.HTTP_200_OK)
        self.assertEqual(tipos.status_code, status.HTTP_200_OK)
        self.assertEqual(professores.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(alunos.data), 2)
        self.assertGreaterEqual(len(tipos.data), 2)
        self.assertGreaterEqual(len(professores.data), 2)
