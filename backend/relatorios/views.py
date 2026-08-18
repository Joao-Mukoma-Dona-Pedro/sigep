from django.db.models import Avg, Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from alunos.models import Aluno
from aulas.models import ControloAula
from disciplinas.models import Disciplina
from ocorrencias.models import Ocorrencia
from pct.analytics import ano_lectivo_analysis, classe_analysis, individual_analysis, turma_analysis
from pct.models import PCT, ResultadoPCT
from planificacoes.models import Planificacao
from professores.models import Lecionacao, Professor
from reunioes.models import Reuniao
from tipos_ocorrencias.models import TipoOcorrencia
from turmas.models import Turma


def pct_trimestre_label(value):
    return {'1': '1.º Trimestre', '2': '2.º Trimestre', '3': '3.º Trimestre'}.get(str(value), value)


def percent(part, total):
    return round((part / total) * 100, 2) if total else 0


def date_range_filter(queryset, field, params):
    data_inicio = params.get('data_inicio')
    data_fim = params.get('data_fim')
    if data_inicio:
        queryset = queryset.filter(**{f'{field}__gte': data_inicio})
    if data_fim:
        queryset = queryset.filter(**{f'{field}__lte': data_fim})
    return queryset


def pct_status(resultados_count, alunos_count):
    if resultados_count == 0:
        return 'Não lançada'
    if alunos_count and resultados_count >= alunos_count:
        return 'Completa'
    return 'Parcial'


class ReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def report_response(self, titulo, params, rows, summary=None):
        return Response({
            'titulo': titulo,
            'filtros': {key: value for key, value in params.items() if value not in ('', None)},
            'resumo': summary or {'total': len(rows)},
            'rows': rows,
        })


class ReportOptionsView(ReportAPIView):
    def get(self, request):
        turmas = Turma.objects.select_related('diretor_turma').order_by('ano_lectivo', 'classe', 'sala')
        return Response({
            'anos_lectivos': list(Turma.objects.values_list('ano_lectivo', flat=True).distinct().order_by('ano_lectivo')),
            'classes': list(Turma.objects.values_list('classe', flat=True).distinct().order_by('classe')),
            'professores': list(Professor.objects.order_by('nome').values('id', 'nome')),
            'disciplinas': list(Disciplina.objects.order_by('nome').values('id', 'nome')),
            'turmas': [
                {'id': turma.id, 'nome': str(turma), 'classe': turma.classe, 'ano_lectivo': turma.ano_lectivo, 'sala': turma.sala}
                for turma in turmas
            ],
            'alunos': list(Aluno.objects.select_related('turma').order_by('nome').values('id', 'nome', 'turma_id')),
            'tipos_ocorrencia': list(TipoOcorrencia.objects.order_by('categoria', 'descricao').values('id', 'descricao', 'categoria')),
            'categorias_ocorrencia': [{'value': value, 'label': label} for value, label in TipoOcorrencia.Categoria.choices],
            'pcts': [
                {
                    'id': pct.id,
                    'nome': f'{pct.lecionacao.disciplina.nome} - {pct.lecionacao.turma} - {pct_trimestre_label(pct.trimestre)}',
                    'trimestre': pct.trimestre,
                    'turma': pct.lecionacao.turma_id,
                    'disciplina': pct.lecionacao.disciplina_id,
                    'ano_lectivo': pct.lecionacao.ano_lectivo,
                }
                for pct in PCT.objects.select_related('lecionacao__disciplina', 'lecionacao__turma').order_by(
                    'lecionacao__ano_lectivo',
                    'trimestre',
                    'lecionacao__turma__classe',
                )
            ],
        })


class ProfessoresReportView(ReportAPIView):
    def get(self, request):
        queryset = Professor.objects.prefetch_related('lecionacoes__disciplina', 'lecionacoes__turma').order_by('nome')
        params = request.query_params
        if params.get('estado'):
            queryset = queryset.filter(estado=params.get('estado'))
        if params.get('disciplina'):
            queryset = queryset.filter(lecionacoes__disciplina_id=params.get('disciplina'))
        if params.get('turma'):
            queryset = queryset.filter(lecionacoes__turma_id=params.get('turma'))
        if params.get('ano_lectivo'):
            queryset = queryset.filter(lecionacoes__ano_lectivo=params.get('ano_lectivo'))
        queryset = queryset.distinct()

        rows = []
        for professor in queryset:
            lecionacoes = [
                f'{item.disciplina.nome} - {item.turma}'
                for item in professor.lecionacoes.all()
            ]
            rows.append({
                'nome': professor.nome,
                'telefone': professor.telefone,
                'email': professor.email,
                'estado': professor.get_estado_display(),
                'data_entrada': professor.data_entrada,
                'lecionacoes': '; '.join(lecionacoes) or '-',
            })

        return self.report_response('Relatório de Professores', params, rows)


class TurmasReportView(ReportAPIView):
    def get(self, request):
        queryset = Turma.objects.select_related('diretor_turma').annotate(total_alunos=Count('alunos')).order_by('ano_lectivo', 'classe', 'sala')
        params = request.query_params
        if params.get('ano_lectivo'):
            queryset = queryset.filter(ano_lectivo=params.get('ano_lectivo'))
        if params.get('classe'):
            queryset = queryset.filter(classe=params.get('classe'))
        if params.get('estado'):
            queryset = queryset.filter(estado=params.get('estado'))

        rows = [{
            'classe': turma.classe,
            'sala': turma.sala,
            'ano_lectivo': turma.ano_lectivo,
            'diretor_turma': turma.diretor_turma.nome if turma.diretor_turma else '-',
            'quantidade_alunos': turma.total_alunos,
            'capacidade': turma.capacidade,
            'estado': turma.get_estado_display(),
        } for turma in queryset]

        return self.report_response('Relatório de Turmas', params, rows)


class AlunosReportView(ReportAPIView):
    def get(self, request):
        queryset = Aluno.objects.select_related('turma').order_by('turma__ano_lectivo', 'turma__classe', 'turma__sala', 'numero', 'nome')
        params = request.query_params
        if params.get('ano_lectivo'):
            queryset = queryset.filter(turma__ano_lectivo=params.get('ano_lectivo'))
        if params.get('classe'):
            queryset = queryset.filter(turma__classe=params.get('classe'))
        if params.get('turma'):
            queryset = queryset.filter(turma_id=params.get('turma'))
        if params.get('estado'):
            queryset = queryset.filter(estado=params.get('estado'))

        rows = [{
            'numero': aluno.numero,
            'nome': aluno.nome,
            'turma': str(aluno.turma),
            'classe': aluno.turma.classe,
            'estado': aluno.get_estado_display(),
            'encarregado_educacao': aluno.encarregado_educacao,
        } for aluno in queryset]

        return self.report_response('Relatório de Alunos', params, rows)


class PlanificacoesReportView(ReportAPIView):
    def get(self, request):
        queryset = Planificacao.objects.select_related('professor').order_by('-data_entrega', 'professor__nome')
        params = request.query_params
        if params.get('professor'):
            queryset = queryset.filter(professor_id=params.get('professor'))
        if params.get('trimestre'):
            queryset = queryset.filter(trimestre=params.get('trimestre'))
        if params.get('entregou') in ('true', 'false'):
            queryset = queryset.filter(entregou=params.get('entregou') == 'true')

        total = queryset.count()
        entregues = queryset.filter(entregou=True).count()
        rows = [{
            'professor': item.professor.nome,
            'trimestre': pct_trimestre_label(item.trimestre),
            'data_entrega': item.data_entrega,
            'situacao_entrega': 'Entregue' if item.entregou else 'Não entregue',
            'observacao': item.observacao,
        } for item in queryset]

        return self.report_response('Relatório de Planificações', params, rows, {
            'total': total,
            'entregues': entregues,
            'nao_entregues': total - entregues,
            'percentual_entrega': percent(entregues, total),
        })


class ControloAulasReportView(ReportAPIView):
    def get(self, request):
        queryset = ControloAula.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma').order_by('-data')
        params = request.query_params
        if params.get('ano_lectivo'):
            queryset = queryset.filter(lecionacao__ano_lectivo=params.get('ano_lectivo'))
        if params.get('professor'):
            queryset = queryset.filter(lecionacao__professor_id=params.get('professor'))
        if params.get('disciplina'):
            queryset = queryset.filter(lecionacao__disciplina_id=params.get('disciplina'))
        if params.get('turma'):
            queryset = queryset.filter(lecionacao__turma_id=params.get('turma'))
        queryset = date_range_filter(queryset, 'data', params)

        total = queryset.count()
        assistidas = queryset.filter(aula_assistida=True).count()
        rows = [{
            'professor': item.lecionacao.professor.nome,
            'disciplina': item.lecionacao.disciplina.nome,
            'turma': str(item.lecionacao.turma),
            'ano_lectivo': item.lecionacao.ano_lectivo,
            'data': item.data,
            'aula_assistida': 'Sim' if item.aula_assistida else 'Não',
            'observacao': item.observacao,
        } for item in queryset]

        return self.report_response('Relatório de Controlo de Aulas', params, rows, {
            'total': total,
            'aulas_assistidas': assistidas,
            'aulas_nao_assistidas': total - assistidas,
            'percentual_aulas_assistidas': percent(assistidas, total),
        })


class PCTReportView(ReportAPIView):
    def get(self, request):
        queryset = PCT.objects.select_related('lecionacao__professor', 'lecionacao__disciplina', 'lecionacao__turma').annotate(
            resultados_count=Count('resultados', distinct=True),
            alunos_count=Count('lecionacao__turma__alunos', distinct=True),
        ).order_by('-data_aplicacao')
        params = request.query_params
        if params.get('ano_lectivo'):
            queryset = queryset.filter(lecionacao__ano_lectivo=params.get('ano_lectivo'))
        if params.get('professor'):
            queryset = queryset.filter(lecionacao__professor_id=params.get('professor'))
        if params.get('disciplina'):
            queryset = queryset.filter(lecionacao__disciplina_id=params.get('disciplina'))
        if params.get('turma'):
            queryset = queryset.filter(lecionacao__turma_id=params.get('turma'))
        if params.get('classe'):
            queryset = queryset.filter(lecionacao__turma__classe=params.get('classe'))
        if params.get('trimestre'):
            queryset = queryset.filter(trimestre=params.get('trimestre'))

        rows = []
        completas = parciais = nao_lancadas = 0
        for item in queryset:
            status = pct_status(item.resultados_count, item.alunos_count)
            completas += 1 if status == 'Completa' else 0
            parciais += 1 if status == 'Parcial' else 0
            nao_lancadas += 1 if status == 'Não lançada' else 0
            rows.append({
                'professor': item.lecionacao.professor.nome,
                'disciplina': item.lecionacao.disciplina.nome,
                'turma': str(item.lecionacao.turma),
                'classe': item.lecionacao.turma.classe,
                'ano_lectivo': item.lecionacao.ano_lectivo,
                'trimestre': pct_trimestre_label(item.trimestre),
                'data_aplicacao': item.data_aplicacao,
                'estado_notas': status,
                'alunos_esperados': item.alunos_count,
                'resultados_lancados': item.resultados_count,
                'cobertura': percent(item.resultados_count, item.alunos_count),
            })

        return self.report_response('Relatório PCT', params, rows, {
            'total': len(rows),
            'completas': completas,
            'parciais': parciais,
            'nao_lancadas': nao_lancadas,
        })


class DesempenhoPCTReportView(ReportAPIView):
    def get(self, request):
        tipo = request.query_params.get('tipo_analise', 'ano_lectivo')
        analysis_map = {
            'individual': individual_analysis,
            'turma': turma_analysis,
            'classe': classe_analysis,
            'ano_lectivo': ano_lectivo_analysis,
        }
        analysis = analysis_map.get(tipo, ano_lectivo_analysis)(request.query_params)
        return Response({
            'titulo': 'Relatório de Desempenho PCT',
            'tipo_analise': tipo,
            'filtros': {key: value for key, value in request.query_params.items() if value not in ('', None)},
            'resumo': analysis.get('resumo', {}),
            'analysis': analysis,
        })


class OcorrenciasReportView(ReportAPIView):
    def get(self, request):
        queryset = Ocorrencia.objects.select_related('aluno__turma', 'tipo', 'registada_por').order_by('-data_ocorrencia')
        params = request.query_params
        if params.get('ano_lectivo'):
            queryset = queryset.filter(aluno__turma__ano_lectivo=params.get('ano_lectivo'))
        if params.get('classe'):
            queryset = queryset.filter(aluno__turma__classe=params.get('classe'))
        if params.get('turma'):
            queryset = queryset.filter(aluno__turma_id=params.get('turma'))
        if params.get('aluno'):
            queryset = queryset.filter(aluno_id=params.get('aluno'))
        if params.get('categoria'):
            queryset = queryset.filter(tipo__categoria=params.get('categoria'))
        if params.get('tipo'):
            queryset = queryset.filter(tipo_id=params.get('tipo'))
        queryset = date_range_filter(queryset, 'data_ocorrencia', params)

        rows = [{
            'aluno': item.aluno.nome,
            'turma': str(item.aluno.turma),
            'classe': item.aluno.turma.classe,
            'data': item.data_ocorrencia,
            'tipo': item.tipo.descricao,
            'categoria': item.tipo.get_categoria_display(),
            'descricao': item.descricao,
            'medida_tomada': item.medida_tomada,
            'registada_por': item.registada_por.nome,
            'observacao': item.observacao,
        } for item in queryset]

        por_categoria = list(queryset.values('tipo__categoria').annotate(total=Count('id')).order_by('tipo__categoria'))
        por_turma = list(queryset.values('aluno__turma__classe', 'aluno__turma__sala').annotate(total=Count('id')).order_by('aluno__turma__classe'))
        por_aluno = list(queryset.values('aluno__nome').annotate(total=Count('id')).order_by('-total', 'aluno__nome')[:10])

        return self.report_response('Relatório de Ocorrências', params, rows, {
            'total': len(rows),
            'por_categoria': por_categoria,
            'por_turma': por_turma,
            'por_aluno': por_aluno,
        })


class ReunioesReportView(ReportAPIView):
    def get(self, request):
        queryset = Reuniao.objects.order_by('-data', 'assunto')
        params = request.query_params
        if params.get('search'):
            queryset = queryset.filter(Q(assunto__icontains=params.get('search')) | Q(participantes__icontains=params.get('search')))
        queryset = date_range_filter(queryset, 'data', params)

        rows = [{
            'data': item.data,
            'assunto': item.assunto,
            'participantes': item.participantes,
            'decisoes': item.decisoes,
            'observacao': item.observacao,
        } for item in queryset]
        return self.report_response('Relatório de Reuniões', params, rows)
