from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from disciplinas.models import Disciplina
from professores.models import Lecionacao, Professor
from turmas.models import Turma

from .models import PCT, ResultadoPCT


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
        self.aluno = Aluno.objects.create(turma=self.turma, numero=1, nome='Maria Jose')
        self.outro_aluno = Aluno.objects.create(turma=self.turma, numero=2, nome='Joao Silva')
        self.aluno_outra_turma = Aluno.objects.create(turma=self.outra_turma, numero=1, nome='Aluno Outra Turma')
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

    def test_criar_resultado_pct_exige_autenticacao(self):
        pct = self.create_pct()

        response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.aluno.id, 'nota': '14.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_resultado_pct(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.aluno.id, 'nota': '14.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ResultadoPCT.objects.count(), 1)
        self.assertEqual(response.data['aluno_info']['nome'], self.aluno.nome)
        self.assertEqual(response.data['lecionacao_info']['disciplina'], self.disciplina.nome)

    def test_listar_consultar_atualizar_e_eliminar_resultado_pct(self):
        self.authenticate()
        pct = self.create_pct()
        resultado = ResultadoPCT.objects.create(pct=pct, aluno=self.aluno, nota='12.00')

        list_response = self.client.get(reverse('pct-resultados-list'), {'pct': pct.id})
        detail_response = self.client.get(reverse('pct-resultados-detail', args=[resultado.id]))
        update_response = self.client.patch(
            reverse('pct-resultados-detail', args=[resultado.id]),
            {'nota': '15.50'},
            format='json',
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data['count'], 1)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        resultado.refresh_from_db()
        self.assertEqual(str(resultado.nota), '15.50')

        delete_response = self.client.delete(reverse('pct-resultados-detail', args=[resultado.id]))

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ResultadoPCT.objects.filter(id=resultado.id).exists())

    def test_resultado_pct_campos_obrigatorios_e_nota_valida(self):
        self.authenticate()
        pct = self.create_pct()

        missing_pct = self.client.post(
            reverse('pct-resultados-list'),
            {'aluno': self.aluno.id, 'nota': '14.00'},
            format='json',
        )
        missing_aluno = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'nota': '14.00'},
            format='json',
        )
        invalid_note = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.aluno.id, 'nota': '-1'},
            format='json',
        )

        self.assertEqual(missing_pct.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('pct', missing_pct.data)
        self.assertEqual(missing_aluno.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('aluno', missing_aluno.data)
        self.assertEqual(invalid_note.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nota', invalid_note.data)

    def test_resultado_pct_valida_escala_oficial_de_notas(self):
        self.authenticate()
        pct = self.create_pct()

        valid_response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.aluno.id, 'nota': '20'},
            format='json',
        )
        above_max_response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.outro_aluno.id, 'nota': '20.01'},
            format='json',
        )
        decimal_places_response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.outro_aluno.id, 'nota': '14.567'},
            format='json',
        )

        self.assertEqual(valid_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(above_max_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nota', above_max_response.data)
        self.assertEqual(decimal_places_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nota', decimal_places_response.data)

    def test_resultado_pct_unique_pct_aluno(self):
        self.authenticate()
        pct = self.create_pct()
        ResultadoPCT.objects.create(pct=pct, aluno=self.aluno, nota='12.00')

        response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.aluno.id, 'nota': '14.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_resultado_pct_rejeita_aluno_de_outra_turma(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.post(
            reverse('pct-resultados-list'),
            {'pct': pct.id, 'aluno': self.aluno_outra_turma.id, 'nota': '14.00'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('aluno', response.data)

    def test_lancamento_manual_cria_e_atualiza_resultados(self):
        self.authenticate()
        pct = self.create_pct()
        ResultadoPCT.objects.create(pct=pct, aluno=self.aluno, nota='10.00')

        response = self.client.post(
            reverse('pct-lancar-notas', args=[pct.id]),
            {
                'resultados': [
                    {'aluno': self.aluno.id, 'nota': '13.50'},
                    {'aluno': self.outro_aluno.id, 'nota': '15'},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ResultadoPCT.objects.count(), 2)
        self.assertEqual(str(ResultadoPCT.objects.get(pct=pct, aluno=self.aluno).nota), '13.50')

    def test_lancamento_manual_rejeita_nota_invalida(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.post(
            reverse('pct-lancar-notas', args=[pct.id]),
            {'resultados': [{'aluno': self.aluno.id, 'nota': 'abc'}]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertEqual(ResultadoPCT.objects.count(), 0)

    def test_lancamento_manual_rejeita_notas_fora_da_escala_oficial(self):
        self.authenticate()
        pct = self.create_pct()

        above_max_response = self.client.post(
            reverse('pct-lancar-notas', args=[pct.id]),
            {'resultados': [{'aluno': self.aluno.id, 'nota': '20.01'}]},
            format='json',
        )
        decimal_places_response = self.client.post(
            reverse('pct-lancar-notas', args=[pct.id]),
            {'resultados': [{'aluno': self.aluno.id, 'nota': '14.567'}]},
            format='json',
        )

        self.assertEqual(above_max_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(decimal_places_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ResultadoPCT.objects.count(), 0)

    def test_importacao_preview_valida_nao_grava_antes_da_confirmacao(self):
        self.authenticate()
        pct = self.create_pct()
        content = 'ID,Numero,Aluno,Nota\n,1,Maria Jose,16\n,2,Joao Silva,14\n'.encode('utf-8')
        file_obj = SimpleUploadedFile('notas.csv', content, content_type='text/csv')

        response = self.client.post(
            reverse('pct-importar-preview', args=[pct.id]),
            {'file': file_obj},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['has_errors'])
        self.assertEqual(len(response.data['rows']), 2)
        self.assertEqual(ResultadoPCT.objects.count(), 0)

    def test_importacao_preview_aluno_nao_encontrado(self):
        self.authenticate()
        pct = self.create_pct()
        content = 'Numero,Aluno,Nota\n99,Aluno Inexistente,16\n'.encode('utf-8')
        file_obj = SimpleUploadedFile('notas.csv', content, content_type='text/csv')

        response = self.client.post(
            reverse('pct-importar-preview', args=[pct.id]),
            {'file': file_obj},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_errors'])
        self.assertIn('Aluno nao encontrado', response.data['rows'][0]['erros'])

    def test_importacao_preview_aluno_ambiguo(self):
        self.authenticate()
        pct = self.create_pct()
        Aluno.objects.create(turma=self.turma, nome='Pedro Manuel')
        Aluno.objects.create(turma=self.turma, nome='Pedro Manuel')
        content = 'Aluno,Nota\nPedro Manuel,16\n'.encode('utf-8')
        file_obj = SimpleUploadedFile('notas.csv', content, content_type='text/csv')

        response = self.client.post(
            reverse('pct-importar-preview', args=[pct.id]),
            {'file': file_obj},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_errors'])
        self.assertIn('Aluno com identificacao ambigua', response.data['rows'][0]['erros'])

    def test_importacao_preview_nota_invalida(self):
        self.authenticate()
        pct = self.create_pct()
        content = 'Numero,Aluno,Nota\n1,Maria Jose,abc\n'.encode('utf-8')
        file_obj = SimpleUploadedFile('notas.csv', content, content_type='text/csv')

        response = self.client.post(
            reverse('pct-importar-preview', args=[pct.id]),
            {'file': file_obj},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_errors'])
        self.assertIn('Nota invalida', response.data['rows'][0]['erros'])

    def test_importacao_preview_rejeita_notas_fora_da_escala_oficial(self):
        self.authenticate()
        pct = self.create_pct()
        content = 'Numero,Aluno,Nota\n1,Maria Jose,20.01\n2,Joao Silva,14.567\n'.encode('utf-8')
        file_obj = SimpleUploadedFile('notas.csv', content, content_type='text/csv')

        response = self.client.post(
            reverse('pct-importar-preview', args=[pct.id]),
            {'file': file_obj},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['has_errors'])
        self.assertIn('Nota invalida', response.data['rows'][0]['erros'])
        self.assertIn('Nota invalida', response.data['rows'][1]['erros'])

    def test_importacao_confirmacao_grava_resultados_validos(self):
        self.authenticate()
        pct = self.create_pct()
        rows = [
            {
                'linha': 2,
                'aluno_id': self.aluno.id,
                'aluno': self.aluno.nome,
                'numero': self.aluno.numero,
                'nota': '16.00',
                'status': 'OK',
                'erros': [],
            }
        ]

        response = self.client.post(
            reverse('pct-importar-confirmar', args=[pct.id]),
            {'rows': rows},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ResultadoPCT.objects.count(), 1)
        self.assertEqual(str(ResultadoPCT.objects.get().nota), '16.00')

    def test_importacao_confirmacao_nao_grava_linhas_com_erro(self):
        self.authenticate()
        pct = self.create_pct()
        rows = [
            {
                'linha': 2,
                'aluno_id': None,
                'aluno': 'Aluno Inexistente',
                'numero': '99',
                'nota': '16.00',
                'status': 'ERRO',
                'erros': ['Aluno nao encontrado'],
            }
        ]

        response = self.client.post(
            reverse('pct-importar-confirmar', args=[pct.id]),
            {'rows': rows},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ResultadoPCT.objects.count(), 0)

    def create_analysis_dataset(self):
        pct1 = self.create_pct(trimestre=PCT.Trimestre.PRIMEIRO, data_aplicacao='2026-03-20')
        pct2 = self.create_pct(trimestre=PCT.Trimestre.SEGUNDO, data_aplicacao='2026-06-20')
        pct3 = self.create_pct(trimestre=PCT.Trimestre.TERCEIRO, data_aplicacao='2026-09-20')
        turma_mesma_classe = Turma.objects.create(
            classe='10',
            sala='B',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
        )
        aluno_turma_b = Aluno.objects.create(turma=turma_mesma_classe, numero=1, nome='Pedro Manuel')
        lecionacao_turma_b = Lecionacao.objects.create(
            professor=self.professor,
            disciplina=self.disciplina,
            turma=turma_mesma_classe,
            ano_lectivo='2026',
        )
        pct_turma_b = PCT.objects.create(
            lecionacao=lecionacao_turma_b,
            trimestre=PCT.Trimestre.PRIMEIRO,
            data_aplicacao='2026-03-20',
        )

        ResultadoPCT.objects.create(pct=pct1, aluno=self.aluno, nota='10.00')
        ResultadoPCT.objects.create(pct=pct1, aluno=self.outro_aluno, nota='20.00')
        ResultadoPCT.objects.create(pct=pct2, aluno=self.aluno, nota='12.00')
        ResultadoPCT.objects.create(pct=pct3, aluno=self.aluno, nota='15.00')
        ResultadoPCT.objects.create(pct=pct_turma_b, aluno=aluno_turma_b, nota='6.00')

        return {
            'pct1': pct1,
            'pct2': pct2,
            'pct3': pct3,
            'turma_b': turma_mesma_classe,
            'aluno_turma_b': aluno_turma_b,
            'pct_turma_b': pct_turma_b,
        }

    def test_analises_exigem_autenticacao(self):
        response = self.client.get(reverse('pct-analise-individual'), {'ano_lectivo': '2026', 'aluno': self.aluno.id})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_analise_individual_calcula_resumo_e_evolucao(self):
        self.authenticate()
        self.create_analysis_dataset()

        response = self.client.get(
            reverse('pct-analise-individual'),
            {'ano_lectivo': '2026', 'aluno': self.aluno.id, 'disciplina': self.disciplina.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['quantidade_resultados'], 3)
        self.assertEqual(response.data['resumo']['media'], 12.333333333333334)
        self.assertEqual(response.data['resumo']['maior_nota'], 15.0)
        self.assertEqual(response.data['resumo']['menor_nota'], 10.0)
        self.assertEqual(response.data['diferencas']['PCT2-PCT1'], 2.0)
        self.assertEqual(response.data['diferencas']['PCT3-PCT2'], 3.0)
        self.assertEqual(response.data['evolucao'][1]['diferenca_anterior'], 2.0)

    def test_analise_turma_trata_lancamento_parcial_sem_zero(self):
        self.authenticate()
        dataset = self.create_analysis_dataset()

        response = self.client.get(
            reverse('pct-analise-turma'),
            {
                'ano_lectivo': '2026',
                'classe': '10',
                'turma': self.turma.id,
                'disciplina': self.disciplina.id,
                'pct': dataset['pct1'].id,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['media'], 15.0)
        self.assertEqual(response.data['resumo']['alunos_esperados'], 2)
        self.assertEqual(response.data['resumo']['alunos_com_resultado'], 2)
        self.assertEqual(response.data['resumo']['alunos_sem_resultado'], 0)
        self.assertEqual(response.data['resumo']['percentual_lancamento'], 100.0)

        partial_pct = dataset['pct2']
        partial_response = self.client.get(
            reverse('pct-analise-turma'),
            {
                'ano_lectivo': '2026',
                'classe': '10',
                'turma': self.turma.id,
                'disciplina': self.disciplina.id,
                'pct': partial_pct.id,
            },
        )

        self.assertEqual(partial_response.status_code, status.HTTP_200_OK)
        self.assertEqual(partial_response.data['resumo']['media'], 12.0)
        self.assertEqual(partial_response.data['resumo']['alunos_sem_resultado'], 1)
        self.assertEqual(partial_response.data['resumo']['percentual_lancamento'], 50.0)
        self.assertTrue(partial_response.data['avisos'])

    def test_analise_classe_usa_resultados_individuais_e_nao_media_das_turmas(self):
        self.authenticate()
        self.create_analysis_dataset()

        response = self.client.get(
            reverse('pct-analise-classe'),
            {
                'ano_lectivo': '2026',
                'classe': '10',
                'disciplina': self.disciplina.id,
                'trimestre': PCT.Trimestre.PRIMEIRO,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['quantidade_resultados'], 3)
        self.assertEqual(response.data['resumo']['media'], 12.0)
        self.assertEqual(len(response.data['comparacao_turmas']), 2)

    def test_analise_ano_lectivo_agrega_classes_disciplinas_e_evolucao(self):
        self.authenticate()
        self.create_analysis_dataset()

        response = self.client.get(reverse('pct-analise-ano-lectivo'), {'ano_lectivo': '2026'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['quantidade_resultados'], 5)
        self.assertEqual(response.data['resumo']['media'], 12.6)
        self.assertEqual(response.data['resumo']['maior_nota'], 20.0)
        self.assertEqual(response.data['resumo']['menor_nota'], 6.0)
        self.assertTrue(response.data['desempenho_por_classe'])
        self.assertTrue(response.data['desempenho_por_disciplina'])
        self.assertTrue(response.data['evolucao_por_trimestre'])

    def test_analise_pct_sem_resultados_retorna_aviso(self):
        self.authenticate()
        pct = self.create_pct()

        response = self.client.get(
            reverse('pct-analise-turma'),
            {
                'ano_lectivo': '2026',
                'classe': '10',
                'turma': self.turma.id,
                'pct': pct.id,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['quantidade_resultados'], 0)
        self.assertEqual(response.data['resumo']['percentual_lancamento'], 0)
        self.assertTrue(response.data['avisos'])

    def test_analise_rejeita_filtros_invalidos(self):
        self.authenticate()
        pct = self.create_pct()

        pct_mismatch = self.client.get(
            reverse('pct-analise-individual'),
            {'ano_lectivo': '2025', 'aluno': self.aluno.id, 'pct': pct.id},
        )
        turma_mismatch = self.client.get(
            reverse('pct-analise-turma'),
            {'ano_lectivo': '2026', 'classe': '11', 'turma': self.turma.id},
        )
        aluno_mismatch = self.client.get(
            reverse('pct-analise-individual'),
            {'ano_lectivo': '2026', 'aluno': self.aluno.id, 'turma': self.outra_turma.id},
        )

        self.assertEqual(pct_mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(turma_mismatch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(aluno_mismatch.status_code, status.HTTP_400_BAD_REQUEST)

    def test_analise_ano_lectivo_sem_dados_retorna_aviso(self):
        self.authenticate()

        response = self.client.get(reverse('pct-analise-ano-lectivo'), {'ano_lectivo': '2030'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['quantidade_resultados'], 0)
        self.assertTrue(response.data['avisos'])
