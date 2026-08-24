from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from turmas.models import Turma

from .models import Aluno


class AlunoAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='diretor@sigep.local',
            password='SenhaForte123',
            full_name='Subdiretor Pedagogico',
        )
        self.turma = Turma.objects.create(
            classe='10',
            sala='A',
            periodo=Turma.Periodo.MANHA,
            ano_lectivo='2026',
            estado=Turma.Estado.ATIVO,
        )
        self.outra_turma = Turma.objects.create(
            classe='11',
            sala='B',
            periodo=Turma.Periodo.TARDE,
            ano_lectivo='2026',
            estado=Turma.Estado.ATIVO,
        )
        self.list_url = reverse('alunos-list')

    def authenticate(self):
        self.client.force_authenticate(user=self.user)

    def create_aluno(self, **kwargs):
        data = {
            'turma': self.turma,
            'numero': 1,
            'nome': 'Maria Jose',
            'data_nascimento': '2010-05-12',
            'sexo': Aluno.Sexo.FEMININO,
            'encarregado_educacao': 'Jose Manuel',
            'telefone_encarregado': '923000111',
            'estado': Aluno.Estado.ATIVO,
            'observacao': 'Aluno de referencia.',
        }
        data.update(kwargs)
        return Aluno.objects.create(**data)

    def valid_payload(self, **overrides):
        data = {
            'turma': self.turma.id,
            'numero': 2,
            'nome': 'Carlos Antonio',
            'data_nascimento': '2011-03-20',
            'sexo': Aluno.Sexo.MASCULINO,
            'encarregado_educacao': 'Antonio Paulo',
            'telefone_encarregado': '923000222',
            'estado': Aluno.Estado.ATIVO,
            'observacao': '',
        }
        data.update(overrides)
        return data

    def test_listagem_exige_autenticacao(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_criar_aluno(self):
        self.authenticate()

        response = self.client.post(self.list_url, self.valid_payload(), format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Aluno.objects.count(), 1)
        self.assertEqual(Aluno.objects.get().turma, self.turma)

    def test_listar_alunos_com_paginacao(self):
        self.authenticate()
        self.create_aluno()

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)

    def test_consultar_aluno(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.get(reverse('alunos-detail', args=[aluno.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nome'], aluno.nome)
        self.assertEqual(response.data['turma_info']['classe'], self.turma.classe)
        self.assertEqual(response.data['turma_info']['sala'], self.turma.sala)

    def test_atualizar_aluno(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.put(
            reverse('alunos-detail', args=[aluno.id]),
            self.valid_payload(nome='Carlos Antonio Atualizado', turma=self.outra_turma.id),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        aluno.refresh_from_db()
        self.assertEqual(aluno.nome, 'Carlos Antonio Atualizado')
        self.assertEqual(aluno.turma, self.outra_turma)

    def test_atualizar_aluno_parcialmente(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.patch(
            reverse('alunos-detail', args=[aluno.id]),
            {'telefone_encarregado': '923999000'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        aluno.refresh_from_db()
        self.assertEqual(aluno.telefone_encarregado, '923999000')

    def test_eliminar_aluno(self):
        self.authenticate()
        aluno = self.create_aluno()

        response = self.client.delete(reverse('alunos-detail', args=[aluno.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Aluno.objects.filter(id=aluno.id).exists())

    def test_validacao_nome_obrigatorio(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(nome='   '),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nome', response.data)

    def test_validacao_turma_obrigatoria(self):
        self.authenticate()
        payload = self.valid_payload()
        payload.pop('turma')

        response = self.client.post(self.list_url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('turma', response.data)

    def test_numero_opcional(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(numero=None),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(Aluno.objects.get().numero)

    def test_numero_unico_dentro_da_turma(self):
        self.authenticate()
        self.create_aluno(numero=7)

        response = self.client.post(
            self.list_url,
            self.valid_payload(numero=7),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)

    def test_mesmo_numero_em_turmas_diferentes(self):
        self.authenticate()
        self.create_aluno(numero=9, turma=self.turma)

        response = self.client.post(
            self.list_url,
            self.valid_payload(numero=9, turma=self.outra_turma.id),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Aluno.objects.filter(numero=9).count(), 2)

    def test_validacao_turma_inexistente(self):
        self.authenticate()

        response = self.client.post(
            self.list_url,
            self.valid_payload(turma=99999),
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('turma', response.data)

    def csv_file(self, content='Número do aluno;Nome completo;Nome do encarregado;Contacto do encarregado\n10;Ana José;;\n'):
        return SimpleUploadedFile('alunos.csv', content.encode('utf-8'), content_type='text/csv')

    def import_url(self, action):
        return reverse(f'alunos-{action}')

    def test_preview_csv_valido_nao_altera_banco(self):
        self.authenticate()
        response = self.client.post(self.import_url('import-preview'), {'turma': self.turma.id, 'ficheiro': self.csv_file()}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['novos'], 1)
        self.assertEqual(Aluno.objects.count(), 0)

    def test_confirmacao_grava_importacao(self):
        self.authenticate()
        response = self.client.post(self.import_url('import-confirm'), {'turma': self.turma.id, 'ficheiro': self.csv_file()}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Aluno.objects.filter(numero=10, nome='Ana José').exists())

    def test_importacao_exige_autenticacao(self):
        response = self.client.post(self.import_url('import-preview'), {'turma': self.turma.id, 'ficheiro': self.csv_file()}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_numero_e_nome_obrigatorios_e_duplicados(self):
        self.authenticate()
        file = self.csv_file('Número do aluno;Nome completo\n;Maria\n2;\n3;A\n3;B\n')
        response = self.client.post(self.import_url('import-preview'), {'turma': self.turma.id, 'ficheiro': file}, format='multipart')
        self.assertEqual(response.data['resumo']['erros'], 4)
        self.assertFalse(response.data['linhas'][0]['numero'])

    def test_actualiza_existente_sem_apagar_opcionais(self):
        self.authenticate()
        aluno = self.create_aluno(numero=10, encarregado_educacao='Maria', telefone_encarregado='923')
        file = self.csv_file('Número do aluno;Nome completo\n10;Novo Nome\n')
        response = self.client.post(self.import_url('import-confirm'), {'turma': self.turma.id, 'ficheiro': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        aluno.refresh_from_db()
        self.assertEqual(aluno.nome, 'Novo Nome')
        self.assertEqual(aluno.encarregado_educacao, 'Maria')
        self.assertEqual(aluno.telefone_encarregado, '923')

    def test_extensao_invalida(self):
        self.authenticate()
        file = SimpleUploadedFile('alunos.txt', b'bad')
        response = self.client.post(self.import_url('import-preview'), {'turma': self.turma.id, 'ficheiro': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_exportacao_respeita_filtro_turma(self):
        self.authenticate()
        self.create_aluno(numero=1, nome='Incluído')
        self.create_aluno(numero=2, nome='Excluído', turma=self.outra_turma)
        response = self.client.get(self.import_url('export-students'), {'turma': self.turma.id})
        body = response.content.decode('utf-8-sig')
        self.assertIn('Incluído', body)
        self.assertNotIn('Excluído', body)

    def test_xlsx_valido(self):
        from openpyxl import Workbook
        from io import BytesIO
        self.authenticate()
        workbook = Workbook()
        sheet = workbook.active
        sheet.append(['Número do aluno', 'Nome completo'])
        sheet.append([15, 'Aluno XLSX'])
        stream = BytesIO()
        workbook.save(stream)
        file = SimpleUploadedFile('alunos.xlsx', stream.getvalue())
        response = self.client.post(self.import_url('import-preview'), {'turma': self.turma.id, 'ficheiro': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['resumo']['novos'], 1)
