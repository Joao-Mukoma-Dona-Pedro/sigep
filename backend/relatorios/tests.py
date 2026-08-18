from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from aulas.models import ControloAula
from disciplinas.models import Disciplina
from ocorrencias.models import Ocorrencia
from pct.models import PCT, ResultadoPCT
from planificacoes.models import Planificacao
from professores.models import Lecionacao, Professor
from reunioes.models import Reuniao
from tipos_ocorrencias.models import TipoOcorrencia
from turmas.models import Turma


class RelatoriosAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagógico',
        )
        self.professor = Professor.objects.create(
            nome='Ana Maria',
            telefone='923000000',
            email='ana@sigep.local',
            estado=Professor.Estado.ATIVO,
        )
        self.disciplina = Disciplina.objects.create(nome='Matemática', codigo='MAT')
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
        self.aluno = Aluno.objects.create(
            turma=self.turma,
            numero=1,
            nome='Carlos Pedro',
            encarregado_educacao='Maria Pedro',
            estado=Aluno.Estado.ATIVO,
        )
        self.lecionacao = Lecionacao.objects.create(
            professor=self.professor,
            disciplina=self.disciplina,
            turma=self.turma,
            ano_lectivo='2026',
        )
        self.planificacao = Planificacao.objects.create(
            professor=self.professor,
            trimestre=Planificacao.Trimestre.PRIMEIRO,
            data_entrega='2026-02-10',
            entregou=True,
        )
        self.controlo = ControloAula.objects.create(
            lecionacao=self.lecionacao,
            data='2026-02-11',
            aula_assistida=True,
        )
        self.pct = PCT.objects.create(
            lecionacao=self.lecionacao,
            trimestre=PCT.Trimestre.PRIMEIRO,
            data_aplicacao='2026-03-20',
        )
        self.resultado = ResultadoPCT.objects.create(
            pct=self.pct,
            aluno=self.aluno,
            nota='16.50',
        )
        self.tipo_ocorrencia = TipoOcorrencia.objects.create(
            descricao='Indisciplina',
            categoria=TipoOcorrencia.Categoria.DISCIPLINAR,
        )
        self.ocorrencia = Ocorrencia.objects.create(
            aluno=self.aluno,
            tipo=self.tipo_ocorrencia,
            data_ocorrencia='2026-03-12',
            descricao='Comportamento inadequado em sala.',
            medida_tomada='Orientação pedagógica.',
            registada_por=self.professor,
        )
        self.reuniao = Reuniao.objects.create(
            data='2026-03-15',
            assunto='Acompanhamento pedagógico',
            participantes='Diretor Pedagógico; Professores',
            decisoes='Reforçar acompanhamento.',
        )

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def test_endpoints_exigem_autenticacao(self):
        endpoints = [
            'relatorios-opcoes',
            'relatorios-professores',
            'relatorios-disciplinas',
            'relatorios-lecionacoes',
            'relatorios-turmas',
            'relatorios-alunos',
            'relatorios-planificacoes',
            'relatorios-controlo-aulas',
            'relatorios-pct',
            'relatorios-desempenho-pct',
            'relatorios-ocorrencias',
            'relatorios-reunioes',
        ]

        for endpoint in endpoints:
            response = self.client.get(reverse(endpoint))
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, endpoint)

    def test_opcoes_retorna_dados_reais(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-opcoes'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['professores'][0]['nome'], self.professor.nome)
        self.assertEqual(response.data['disciplinas'][0]['nome'], self.disciplina.nome)
        self.assertIn('2026', response.data['anos_lectivos'])

    def test_relatorio_professores_filtra_por_disciplina(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-professores'), {'disciplina': self.disciplina.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['total'], 1)
        self.assertIn('Matemática', response.data['rows'][0]['lecionacoes'])
        self.assertIn('seccoes', response.data)

    def test_relatorio_disciplinas_reune_contexto_pedagogico(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-disciplinas'), {'disciplina': self.disciplina.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rows'][0]['nome'], self.disciplina.nome)
        self.assertGreaterEqual(len(response.data['seccoes']), 3)

    def test_relatorio_lecionacoes_reune_contexto_pedagogico(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-lecionacoes'), {'lecionacao': self.lecionacao.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rows'][0]['professor'], self.professor.nome)
        self.assertGreaterEqual(len(response.data['seccoes']), 3)

    def test_relatorio_turmas_agrega_quantidade_alunos(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-turmas'), {'ano_lectivo': '2026'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rows'][0]['quantidade_alunos'], 1)
        self.assertEqual(response.data['rows'][0]['diretor_turma'], self.professor.nome)

    def test_relatorio_alunos_filtra_por_turma(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-alunos'), {'turma': self.turma.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['total'], 1)
        self.assertEqual(response.data['rows'][0]['nome'], self.aluno.nome)

    def test_relatorio_planificacoes_agrega_entregas(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-planificacoes'), {'entregou': 'true'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['total'], 1)
        self.assertEqual(response.data['resumo']['entregues'], 1)
        self.assertEqual(response.data['resumo']['percentual_entrega'], 100)

    def test_relatorio_controlo_aulas_agrega_assistidas(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-controlo-aulas'), {'ano_lectivo': '2026'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['aulas_assistidas'], 1)
        self.assertEqual(response.data['rows'][0]['aula_assistida'], 'Sim')

    def test_relatorio_pct_calcula_cobertura_sem_tratar_ausente_como_zero(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-pct'), {'ano_lectivo': '2026'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rows'][0]['resultados_lancados'], 1)
        self.assertEqual(response.data['rows'][0]['alunos_esperados'], 1)
        self.assertEqual(response.data['rows'][0]['estado_notas'], 'Completa')
        self.assertEqual(response.data['rows'][0]['cobertura'], 100)

    def test_relatorio_desempenho_pct_reutiliza_analise_existente(self):
        self.authenticate()

        response = self.client.get(
            reverse('relatorios-desempenho-pct'),
            {'tipo_analise': 'ano_lectivo', 'ano_lectivo': '2026'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['quantidade_resultados'], 1)
        self.assertEqual(response.data['resumo']['media'], 16.5)

    def test_relatorio_ocorrencias_filtra_por_categoria(self):
        self.authenticate()

        response = self.client.get(
            reverse('relatorios-ocorrencias'),
            {'categoria': TipoOcorrencia.Categoria.DISCIPLINAR},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['total'], 1)
        self.assertEqual(response.data['rows'][0]['aluno'], self.aluno.nome)

    def test_relatorio_reunioes_filtra_por_data(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-reunioes'), {'data_inicio': '2026-03-15', 'data_fim': '2026-03-15'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['total'], 1)
        self.assertEqual(response.data['rows'][0]['assunto'], self.reuniao.assunto)

    def test_relatorio_vazio_retorna_lista_vazia(self):
        self.authenticate()

        response = self.client.get(reverse('relatorios-alunos'), {'classe': '99'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['total'], 0)
        self.assertEqual(response.data['rows'], [])
