from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from ocorrencias.models import Ocorrencia
from professores.models import Professor
from turmas.models import Turma

from .models import TipoOcorrencia


class TipoOcorrenciaAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagogico',
        )
        self.list_url = reverse('tipos-ocorrencia-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_tipo(self, **kwargs):
        data = {
            'descricao': 'Indisciplina em sala de aula',
            'categoria': TipoOcorrencia.Categoria.DISCIPLINAR,
        }
        data.update(kwargs)
        return TipoOcorrencia.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'descricao': 'Falta de material',
            'categoria': TipoOcorrencia.Categoria.COMPORTAMENTAL,
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_tipo_ocorrencia(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TipoOcorrencia.objects.count(), 1)
        self.assertEqual(TipoOcorrencia.objects.get().descricao, 'Falta de material')

    def test_listar_tipos_ocorrencia_com_paginacao(self):
        self.authenticate()
        self.create_tipo()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_tipo_ocorrencia(self):
        self.authenticate()
        tipo = self.create_tipo()

        response = self.client.get(reverse('tipos-ocorrencia-detail', args=[tipo.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['descricao'], tipo.descricao)

    def test_atualizar_tipo_ocorrencia(self):
        self.authenticate()
        tipo = self.create_tipo()

        response = self.client.put(
            reverse('tipos-ocorrencia-detail', args=[tipo.id]),
            self.valid_payload(
                descricao='Baixo aproveitamento',
                categoria=TipoOcorrencia.Categoria.ACADEMICA,
            ),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tipo.refresh_from_db()
        self.assertEqual(tipo.descricao, 'Baixo aproveitamento')
        self.assertEqual(tipo.categoria, TipoOcorrencia.Categoria.ACADEMICA)

    def test_atualizar_tipo_ocorrencia_parcialmente(self):
        self.authenticate()
        tipo = self.create_tipo()

        response = self.client.patch(
            reverse('tipos-ocorrencia-detail', args=[tipo.id]),
            {'categoria': TipoOcorrencia.Categoria.OUTROS},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tipo.refresh_from_db()
        self.assertEqual(tipo.categoria, TipoOcorrencia.Categoria.OUTROS)

    def test_eliminar_tipo_ocorrencia(self):
        self.authenticate()
        tipo = self.create_tipo()

        response = self.client.delete(reverse('tipos-ocorrencia-detail', args=[tipo.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TipoOcorrencia.objects.filter(id=tipo.id).exists())

    def test_validacao_descricao_obrigatoria(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(descricao='   '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('descricao', response.data)

    def test_validacao_descricao_unica(self):
        self.authenticate()
        self.create_tipo(descricao='Falta de material')

        response = self.client.post(
            self.list_url,
            self.valid_payload(descricao='Falta de material'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('descricao', response.data)

    def test_validacao_categoria(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(categoria='INVALIDA'),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('categoria', response.data)

    def test_pesquisa_por_descricao(self):
        self.authenticate()
        self.create_tipo(descricao='Indisciplina em sala de aula')
        self.create_tipo(
            descricao='Baixo aproveitamento',
            categoria=TipoOcorrencia.Categoria.ACADEMICA,
        )

        response = self.client.get(self.list_url, {'search': 'Baixo'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['descricao'], 'Baixo aproveitamento')

    def test_filtro_por_categoria(self):
        self.authenticate()
        self.create_tipo(descricao='Indisciplina')
        self.create_tipo(
            descricao='Baixo aproveitamento',
            categoria=TipoOcorrencia.Categoria.ACADEMICA,
        )

        response = self.client.get(
            self.list_url,
            {'categoria': TipoOcorrencia.Categoria.ACADEMICA},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['categoria'], TipoOcorrencia.Categoria.ACADEMICA)

    def test_bloqueio_de_eliminacao_futura_relacao(self):
        self.authenticate()
        tipo = self.create_tipo()
        professor = Professor.objects.create(nome='Ana Maria', email='ana.tipo@sigep.local')
        turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
        )
        aluno = Aluno.objects.create(turma=turma, numero=1, nome='Maria Jose')
        Ocorrencia.objects.create(
            aluno=aluno,
            tipo=tipo,
            data_ocorrencia='2026-03-20',
            descricao='Ocorrência disciplinar registada.',
            registada_por=professor,
        )

        response = self.client.delete(reverse('tipos-ocorrencia-detail', args=[tipo.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(TipoOcorrencia.objects.filter(id=tipo.id).exists())
