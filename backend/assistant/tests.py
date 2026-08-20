import inspect

from django.contrib.auth import get_user_model
from django.test import TestCase

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

from . import tools


class AssistantToolsTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdirector Pedagogico',
        )
        self.professor = Professor.objects.create(nome='Ana Maria', estado=Professor.Estado.ATIVO)
        self.professor_inactivo = Professor.objects.create(nome='Carlos Manuel', estado=Professor.Estado.INATIVO)
        self.disciplina = Disciplina.objects.create(nome='Matematica', codigo='MAT', estado=Disciplina.Estado.ATIVO)
        self.disciplina_inactiva = Disciplina.objects.create(nome='Fisica', codigo='FIS', estado=Disciplina.Estado.INATIVO)
        self.turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            turno='Regular',
            capacidade=30,
            diretor_turma=self.professor,
        )
        self.outra_turma = Turma.objects.create(
            classe='11',
            sala='B',
            periodo=Turma.Periodo.TARDE,
            ano_lectivo='2026',
            turno='Regular',
            capacidade=25,
            diretor_turma=self.professor,
        )
        self.aluno = Aluno.objects.create(turma=self.turma, numero=1, nome='Carlos Pedro')
        self.outro_aluno = Aluno.objects.create(turma=self.turma, numero=2, nome='Maria Ana')
        self.lecionacao = Lecionacao.objects.create(
            professor=self.professor,
            disciplina=self.disciplina,
            turma=self.turma,
            ano_lectivo='2026',
        )
        self.planificacao = Planificacao.objects.create(
            lecionacao=self.lecionacao,
            trimestre=Planificacao.Trimestre.PRIMEIRO,
            data_entrega='2026-02-10',
            entregou=True,
        )
        self.controlo = ControloAula.objects.create(
            lecionacao=self.lecionacao,
            data='2026-02-15',
            aula_assistida=True,
        )
        self.pct = PCT.objects.create(
            lecionacao=self.lecionacao,
            trimestre=PCT.Trimestre.PRIMEIRO,
            data_aplicacao='2026-03-20',
            nota_lancada=False,
        )
        self.resultado = ResultadoPCT.objects.create(pct=self.pct, aluno=self.aluno, nota='14.50')
        self.tipo = TipoOcorrencia.objects.create(
            descricao='Indisciplina',
            categoria=TipoOcorrencia.Categoria.DISCIPLINAR,
        )
        self.ocorrencia = Ocorrencia.objects.create(
            aluno=self.aluno,
            tipo=self.tipo,
            data_ocorrencia='2026-03-22',
            descricao='Ocorrencia de teste.',
            registada_por=self.professor,
        )
        self.reuniao = Reuniao.objects.create(
            data='2026-03-25',
            assunto='Acompanhamento pedagogico',
            participantes='Direccao',
            decisoes='Acompanhar a turma.',
        )

    def test_ferramenta_exige_utilizador_autenticado(self):
        response = tools.get_school_summary(None)

        self.assertFalse(response['ok'])
        self.assertEqual(response['error']['code'], 'AUTHENTICATION_REQUIRED')

    def test_school_summary_usa_dados_reais(self):
        response = tools.get_school_summary(self.user)

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['professores']['total'], 2)
        self.assertEqual(response['data']['turmas']['total'], 2)
        self.assertEqual(response['data']['alunos']['total'], 2)
        self.assertEqual(response['data']['pct']['total'], 1)

    def test_professores_e_disciplinas_summary(self):
        professores = tools.get_professores_summary(self.user)
        disciplinas = tools.get_disciplinas_summary(self.user)

        self.assertEqual(professores['data']['activos'], 1)
        self.assertEqual(professores['data']['inactivos'], 1)
        self.assertEqual(disciplinas['data']['activas'], 1)
        self.assertEqual(disciplinas['data']['inactivas'], 1)

    def test_get_professor_activity_retorna_contexto_sem_inventar_campos(self):
        response = tools.get_professor_activity(self.user, self.professor.id)

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['leccionacoes'], 1)
        self.assertEqual(response['data']['planificacoes']['entregues'], 1)
        self.assertEqual(response['data']['controlo_aulas']['assistidas'], 1)

    def test_turma_e_aluno_retornam_apenas_contexto_necessario(self):
        turma = tools.get_turma(self.user, self.turma.id)
        aluno = tools.get_aluno(self.user, self.aluno.id)

        self.assertEqual(turma['data']['quantidade_alunos'], 2)
        self.assertEqual(aluno['data']['classe'], '10')
        self.assertNotIn('telefone_encarregado', aluno['data'])
        self.assertNotIn('data_nascimento', aluno['data'])

    def test_leccionacoes_respeitam_filtros_controlados(self):
        response = tools.get_leccionacoes(
            self.user,
            {
                'professor_id': self.professor.id,
                'disciplina_id': self.disciplina.id,
                'turma_id': self.turma.id,
                'ano_lectivo': '2026',
            },
        )

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total'], 1)
        self.assertEqual(response['data']['items'][0]['disciplina'], self.disciplina.nome)

    def test_filtro_incompativel_de_turma_e_ano_lectivo_retorna_erro_controlado(self):
        response = tools.get_leccionacoes(self.user, {'turma_id': self.turma.id, 'ano_lectivo': '2027'})

        self.assertFalse(response['ok'])
        self.assertEqual(response['error']['code'], 'INVALID_FILTER')

    def test_planificacoes_usam_leccionacao(self):
        response = tools.get_planificacoes(self.user, {'professor_id': self.professor.id, 'trimestre': '1'})

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total'], 1)
        self.assertEqual(response['data']['items'][0]['professor'], self.professor.nome)
        self.assertEqual(response['data']['items'][0]['disciplina'], self.disciplina.nome)

    def test_controlo_aulas_summary(self):
        response = tools.get_controlo_aulas_summary(self.user)

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total'], 1)
        self.assertEqual(response['data']['aulas_assistidas'], 1)
        self.assertEqual(response['data']['aulas_nao_assistidas'], 0)

    def test_pct_summary_calcula_estado_a_partir_de_resultados_reais(self):
        response = tools.get_pct_summary(self.user)

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['com_resultados'], 1)
        self.assertEqual(response['data']['parcialmente_lancadas'], 1)
        self.assertEqual(response['data']['completamente_lancadas'], 0)

    def test_pct_results_nao_transforma_ausencia_em_zero(self):
        response = tools.get_pct_results(self.user, {'ano_lectivo': '2026', 'turma': self.turma.id})

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total_resultados'], 1)
        self.assertEqual(response['data']['media'], 14.5)
        notas = [item['nota'] for item in response['data']['items']]
        self.assertNotIn(0, notas)

    def test_pct_analysis_reutiliza_logica_oficial(self):
        response = tools.get_pct_analysis(
            self.user,
            'turma',
            {'ano_lectivo': '2026', 'classe': '10', 'turma': self.turma.id},
        )

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['resumo']['quantidade_resultados'], 1)
        self.assertTrue(response['data']['avisos'])

    def test_ocorrencias_minimizam_dados_pessoais_quando_nao_e_individual(self):
        response = tools.get_ocorrencias(self.user, {'turma_id': self.turma.id})

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total'], 1)
        self.assertIsNone(response['data']['items'][0]['aluno'])

    def test_ocorrencias_individuais_podem_incluir_nome_necessario(self):
        response = tools.get_ocorrencias(self.user, {'aluno_id': self.aluno.id})

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['items'][0]['aluno'], self.aluno.nome)

    def test_reunioes_summary_retorna_dados_reais(self):
        response = tools.get_reunioes_summary(self.user, {'data_inicio': '2026-01-01', 'data_fim': '2026-12-31'})

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total'], 1)
        self.assertEqual(response['data']['items'][0]['assunto'], self.reuniao.assunto)

    def test_zero_dados_e_diferente_de_erro(self):
        ResultadoPCT.objects.all().delete()

        response = tools.get_pct_results(self.user, {'ano_lectivo': '2026', 'turma': self.turma.id})

        self.assertTrue(response['ok'])
        self.assertEqual(response['data']['total_resultados'], 0)
        self.assertIsNone(response['data']['media'])

    def test_lista_explicitamente_ferramentas_permitidas(self):
        self.assertIn('school_summary', tools.ASSISTANT_READ_TOOLS)
        self.assertNotIn('__import__', tools.ASSISTANT_READ_TOOLS)
        self.assertNotIn('raw_sql', tools.ASSISTANT_READ_TOOLS)

    def test_nao_usa_execucao_dinamica_arbitraria(self):
        source = inspect.getsource(tools)

        self.assertNotIn('cursor.execute', source)
        self.assertNotIn('getattr(', source)
        self.assertNotIn('eval(', source)
        self.assertNotIn('exec(', source)

