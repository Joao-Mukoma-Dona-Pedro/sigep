import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import { getRelatorio, listRelatorioOptions } from '../services/relatorioService';

const reportTypes = [
  { key: 'professores', title: 'Professor' },
  { key: 'alunos', title: 'Aluno' },
  { key: 'turmas', title: 'Turma' },
  { key: 'disciplinas', title: 'Disciplina' },
  { key: 'lecionacoes', title: 'Leccionação' },
  { key: 'planificacoes', title: 'Planificação' },
  { key: 'controloAulas', title: 'Controlo de Aulas' },
  { key: 'pct', title: 'PCT' },
  { key: 'desempenhoPCT', title: 'Desempenho PCT' },
  { key: 'ocorrencias', title: 'Ocorrências' },
  { key: 'reunioes', title: 'Reuniões' },
];

const columnsByType = {
  professores: [['nome', 'Nome'], ['telefone', 'Telefone'], ['email', 'E-mail'], ['estado', 'Estado'], ['data_entrada', 'Data de Entrada'], ['lecionacoes', 'Leccionações']],
  alunos: [['numero', 'Número'], ['nome', 'Nome'], ['turma', 'Turma'], ['classe', 'Classe'], ['estado', 'Estado'], ['encarregado_educacao', 'Encarregado de Educação']],
  turmas: [['classe', 'Classe'], ['sala', 'Turma/Sala'], ['periodo', 'Período'], ['turno', 'Turno'], ['ano_lectivo', 'Ano Lectivo'], ['diretor_turma', 'Director de Turma'], ['quantidade_alunos', 'Alunos'], ['capacidade', 'Capacidade'], ['estado', 'Estado']],
  disciplinas: [['nome', 'Nome'], ['codigo', 'Código'], ['estado', 'Estado'], ['observacao', 'Observação']],
  lecionacoes: [['professor', 'Professor'], ['disciplina', 'Disciplina'], ['turma', 'Turma'], ['classe', 'Classe'], ['ano_lectivo', 'Ano Lectivo'], ['estado', 'Estado']],
  planificacoes: [['professor', 'Professor'], ['trimestre', 'Trimestre'], ['data_entrega', 'Data de Entrega'], ['situacao_entrega', 'Situação'], ['observacao', 'Observação']],
  controloAulas: [['professor', 'Professor'], ['disciplina', 'Disciplina'], ['turma', 'Turma'], ['ano_lectivo', 'Ano Lectivo'], ['data', 'Data'], ['aula_assistida', 'Aula Assistida'], ['observacao', 'Observação']],
  pct: [['professor', 'Professor'], ['disciplina', 'Disciplina'], ['turma', 'Turma'], ['classe', 'Classe'], ['ano_lectivo', 'Ano Lectivo'], ['trimestre', 'Trimestre'], ['data_aplicacao', 'Data de Aplicação'], ['estado_notas', 'Estado das Notas'], ['cobertura', 'Cobertura (%)']],
  ocorrencias: [['aluno', 'Aluno'], ['turma', 'Turma'], ['classe', 'Classe'], ['data', 'Data'], ['tipo', 'Tipo'], ['categoria', 'Categoria'], ['descricao', 'Descrição'], ['medida_tomada', 'Medida Tomada'], ['registada_por', 'Registada Por']],
  reunioes: [['data', 'Data'], ['assunto', 'Assunto'], ['participantes', 'Participantes'], ['decisoes', 'Decisões'], ['observacao', 'Observação']],
};

const initialFilters = {
  ano_lectivo: '',
  classe: '',
  turma: '',
  aluno: '',
  professor: '',
  disciplina: '',
  lecionacao: '',
  trimestre: '',
  estado: '',
  entregou: '',
  categoria: '',
  tipo: '',
  data_inicio: '',
  data_fim: '',
  search: '',
  tipo_analise: 'ano_lectivo',
  pct: '',
};

function getErrorMessage(error) {
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está activo.';
  if (error.response.status === 401) return 'A sua sessão expirou. Entre novamente no SIGEP.';
  if (error.response.status === 400) {
    const data = error.response.data;
    const firstField = Object.keys(data || {})[0];
    const firstMessage = firstField ? data[firstField] : null;
    return Array.isArray(firstMessage) ? firstMessage[0] : firstMessage || 'Verifique os filtros do relatório.';
  }
  return 'Ocorreu um erro ao gerar o relatório.';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value;
  if (typeof value === 'object') {
    if (value.nome) return value.numero ? `${value.numero} - ${value.nome}` : value.nome;
    return JSON.stringify(value);
  }
  return String(value);
}

function humanizeKey(key) {
  return key.replaceAll('_', ' ').replaceAll('pct', 'PCT');
}

function summaryEntries(summary = {}) {
  return Object.entries(summary).filter(([, value]) => !Array.isArray(value) && typeof value !== 'object');
}

function columnsFromRows(rows = []) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];
  return keys.map((key) => [key, humanizeKey(key)]);
}

function buildCsv(columns, rows) {
  const escape = (value) => `"${String(formatValue(value)).replaceAll('"', '""')}"`;
  const header = columns.map(([, label]) => escape(label)).join(';');
  const body = rows.map((row) => columns.map(([key]) => escape(row[key])).join(';')).join('\n');
  return `${header}\n${body}`;
}

function downloadCsv(filename, content) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function DetailSection({ items }) {
  return (
    <div className="report-detail-grid">
      {Object.entries(items || {}).map(([key, value]) => (
        <div className="detail-item" key={key}>
          <span>{humanizeKey(key)}</span>
          <strong>{formatValue(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function DataTable({ rows = [], columns, empty = 'Sem dados.' }) {
  const tableColumns = columns?.length ? columns : columnsFromRows(rows);
  return (
    <div className="table-responsive">
      <table className="table sigep-table align-middle">
        <thead>
          <tr>{tableColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={Math.max(tableColumns.length, 1)} className="text-center text-muted py-4">{empty}</td></tr>}
          {rows.map((row, index) => (
            <tr key={index}>
              {tableColumns.map(([key]) => <td key={key}>{formatValue(row[key])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalysisSection({ analysis }) {
  const tables = [
    ['Evolução', analysis?.evolucao],
    ['Tabela', analysis?.tabela],
    ['Média por Turma', analysis?.media_por_turma],
    ['Desempenho por Classe', analysis?.desempenho_por_classe],
    ['Distribuição', analysis?.distribuicao],
  ].filter(([, rows]) => Array.isArray(rows));

  return (
    <div className="report-section-stack">
      {Array.isArray(analysis?.avisos) && analysis.avisos.length > 0 && (
        <div className="alert alert-warning mb-0">{analysis.avisos.join(' ')}</div>
      )}
      {tables.map(([title, rows]) => (
        <section className="report-section" key={title}>
          <h3>{title}</h3>
          <DataTable rows={rows} empty="Sem dados suficientes." />
        </section>
      ))}
    </div>
  );
}

function ReportSection({ section }) {
  return (
    <section className="report-section">
      <h3>{section.titulo}</h3>
      {section.tipo === 'detalhes' ? (
        <DetailSection items={section.items} />
      ) : (
        <DataTable rows={section.rows || []} empty={section.empty} />
      )}
    </section>
  );
}

function RelatoriosPage() {
  const [activeType, setActiveType] = useState('professores');
  const [filters, setFilters] = useState(initialFilters);
  const [options, setOptions] = useState({
    anos_lectivos: [],
    classes: [],
    professores: [],
    disciplinas: [],
    lecionacoes: [],
    turmas: [],
    alunos: [],
    tipos_ocorrencia: [],
    categorias_ocorrencia: [],
    pcts: [],
  });
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const activeReport = reportTypes.find((item) => item.key === activeType);
  const filteredTurmas = useMemo(() => options.turmas.filter((turma) => {
    if (filters.ano_lectivo && turma.ano_lectivo !== filters.ano_lectivo) return false;
    if (filters.classe && turma.classe !== filters.classe) return false;
    return true;
  }), [options.turmas, filters.ano_lectivo, filters.classe]);
  const filteredAlunos = useMemo(() => options.alunos.filter((aluno) => {
    if (filters.turma && String(aluno.turma_id) !== String(filters.turma)) return false;
    return true;
  }), [options.alunos, filters.turma]);
  const filteredPcts = useMemo(() => options.pcts.filter((pct) => {
    if (filters.ano_lectivo && pct.ano_lectivo !== filters.ano_lectivo) return false;
    if (filters.trimestre && pct.trimestre !== filters.trimestre) return false;
    if (filters.turma && String(pct.turma) !== String(filters.turma)) return false;
    if (filters.disciplina && String(pct.disciplina) !== String(filters.disciplina)) return false;
    return true;
  }), [options.pcts, filters]);
  const filteredLecionacoes = useMemo(() => options.lecionacoes.filter((item) => {
    if (filters.ano_lectivo && item.ano_lectivo !== filters.ano_lectivo) return false;
    if (filters.professor && String(item.professor) !== String(filters.professor)) return false;
    if (filters.disciplina && String(item.disciplina) !== String(filters.disciplina)) return false;
    if (filters.turma && String(item.turma) !== String(filters.turma)) return false;
    return true;
  }), [options.lecionacoes, filters]);

  const rows = activeType === 'desempenhoPCT'
    ? report?.analysis?.tabela || report?.analysis?.media_por_turma || report?.analysis?.desempenho_por_classe || []
    : report?.rows || [];
  const columns = columnsByType[activeType] || columnsFromRows(rows);

  useEffect(() => {
    async function loadOptions() {
      try {
        const data = await listRelatorioOptions();
        setOptions(data);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      }
    }
    loadOptions();
  }, []);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => {
      const next = { ...current, [name]: value };
      if (name === 'ano_lectivo') {
        next.classe = '';
        next.turma = '';
        next.aluno = '';
        next.pct = '';
        next.lecionacao = '';
      }
      if (name === 'classe') {
        next.turma = '';
        next.aluno = '';
        next.pct = '';
      }
      if (name === 'turma') {
        next.aluno = '';
        next.pct = '';
        next.lecionacao = '';
      }
      return next;
    });
  }

  function cleanFilters() {
    const allowedByType = {
      professores: ['professor', 'estado', 'disciplina', 'turma', 'ano_lectivo'],
      alunos: ['aluno', 'ano_lectivo', 'classe', 'turma', 'estado'],
      turmas: ['turma', 'ano_lectivo', 'classe', 'estado'],
      disciplinas: ['disciplina', 'estado'],
      lecionacoes: ['lecionacao', 'ano_lectivo', 'professor', 'disciplina', 'turma'],
      planificacoes: ['professor', 'trimestre', 'entregou'],
      controloAulas: ['ano_lectivo', 'professor', 'disciplina', 'turma', 'data_inicio', 'data_fim'],
      pct: ['pct', 'ano_lectivo', 'professor', 'disciplina', 'turma', 'classe', 'trimestre'],
      desempenhoPCT: ['tipo_analise', 'ano_lectivo', 'trimestre', 'classe', 'turma', 'disciplina', 'aluno', 'pct'],
      ocorrencias: ['ano_lectivo', 'classe', 'turma', 'aluno', 'categoria', 'tipo', 'data_inicio', 'data_fim'],
      reunioes: ['search', 'data_inicio', 'data_fim'],
    };
    const allowed = allowedByType[activeType] || [];
    return Object.fromEntries(Object.entries(filters).filter(([key, value]) => allowed.includes(key) && value));
  }

  async function generateReport() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getRelatorio(activeType, cleanFilters());
      setReport(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  function changeReportType(event) {
    setActiveType(event.target.value);
    setReport(null);
    setError('');
  }

  function handleExportCsv() {
    if (!columns.length || !rows.length) return;
    downloadCsv(`${activeType}-sigep.csv`, buildCsv(columns, rows));
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="page-stack reports-page">
      <PageHeader
        title="Relatórios"
        breadcrumbs={['Relatórios']}
        actions={(
          <div className="button-cluster">
            <button className="btn btn-outline-secondary" type="button" onClick={handlePrint} disabled={!report}>
              <i className="bi bi-printer" /> Imprimir / PDF
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={handleExportCsv} disabled={!rows.length || !columns.length}>
              <i className="bi bi-file-earmark-spreadsheet" /> Exportar CSV
            </button>
          </div>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="panel-card report-control-panel no-print">
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label" htmlFor="report_type">Tipo de Relatório</label>
            <select id="report_type" className="form-select" value={activeType} onChange={changeReportType}>
              {reportTypes.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
            </select>
          </div>
          {['professores', 'planificacoes', 'controloAulas', 'pct', 'lecionacoes'].includes(activeType) && (
            <div className="col-md-4">
              <label className="form-label" htmlFor="professor">Professor</label>
              <select id="professor" className="form-select" name="professor" value={filters.professor} onChange={updateFilter}>
                <option value="">Todos</option>
                {options.professores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {activeType === 'alunos' && (
            <div className="col-md-4">
              <label className="form-label" htmlFor="aluno">Aluno</label>
              <select id="aluno" className="form-select" name="aluno" value={filters.aluno} onChange={updateFilter}>
                <option value="">Todos</option>
                {filteredAlunos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {activeType === 'disciplinas' && (
            <div className="col-md-4">
              <label className="form-label" htmlFor="disciplina">Disciplina</label>
              <select id="disciplina" className="form-select" name="disciplina" value={filters.disciplina} onChange={updateFilter}>
                <option value="">Todas</option>
                {options.disciplinas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {activeType === 'lecionacoes' && (
            <div className="col-md-4">
              <label className="form-label" htmlFor="lecionacao">Leccionação</label>
              <select id="lecionacao" className="form-select" name="lecionacao" value={filters.lecionacao} onChange={updateFilter}>
                <option value="">Todas</option>
                {filteredLecionacoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {['professores', 'alunos', 'turmas', 'controloAulas', 'pct', 'desempenhoPCT', 'ocorrencias', 'lecionacoes'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="ano_lectivo">Ano Lectivo</label>
              <select id="ano_lectivo" className="form-select" name="ano_lectivo" value={filters.ano_lectivo} onChange={updateFilter}>
                <option value="">Todos</option>
                {options.anos_lectivos.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          )}
          {['alunos', 'turmas', 'pct', 'desempenhoPCT', 'ocorrencias'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="classe">Classe</label>
              <select id="classe" className="form-select" name="classe" value={filters.classe} onChange={updateFilter}>
                <option value="">Todas</option>
                {options.classes.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          )}
          {['professores', 'alunos', 'turmas', 'controloAulas', 'pct', 'desempenhoPCT', 'ocorrencias', 'lecionacoes'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="turma">Turma</label>
              <select id="turma" className="form-select" name="turma" value={filters.turma} onChange={updateFilter}>
                <option value="">Todas</option>
                {filteredTurmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {['professores', 'controloAulas', 'pct', 'desempenhoPCT', 'lecionacoes'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="disciplina_filter">Disciplina</label>
              <select id="disciplina_filter" className="form-select" name="disciplina" value={filters.disciplina} onChange={updateFilter}>
                <option value="">Todas</option>
                {options.disciplinas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {['planificacoes', 'pct', 'desempenhoPCT'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="trimestre">Trimestre</label>
              <select id="trimestre" className="form-select" name="trimestre" value={filters.trimestre} onChange={updateFilter}>
                <option value="">Todos</option>
                <option value="1">1.º Trimestre</option>
                <option value="2">2.º Trimestre</option>
                <option value="3">3.º Trimestre</option>
              </select>
            </div>
          )}
          {['professores', 'alunos', 'turmas', 'disciplinas'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="estado">Estado</label>
              <select id="estado" className="form-select" name="estado" value={filters.estado} onChange={updateFilter}>
                <option value="">Todos</option>
                <option value="ATIVO">Activo</option>
                <option value="INATIVO">Inactivo</option>
              </select>
            </div>
          )}
          {activeType === 'planificacoes' && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="entregou">Entrega</label>
              <select id="entregou" className="form-select" name="entregou" value={filters.entregou} onChange={updateFilter}>
                <option value="">Todas</option>
                <option value="true">Entregues</option>
                <option value="false">Não entregues</option>
              </select>
            </div>
          )}
          {['pct', 'desempenhoPCT'].includes(activeType) && (
            <>
              {activeType === 'desempenhoPCT' && (
                <>
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="tipo_analise">Tipo de Análise</label>
                    <select id="tipo_analise" className="form-select" name="tipo_analise" value={filters.tipo_analise} onChange={updateFilter}>
                      <option value="ano_lectivo">Ano Lectivo</option>
                      <option value="classe">Classe</option>
                      <option value="turma">Turma</option>
                      <option value="individual">Individual</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="aluno_analise">Aluno</label>
                    <select id="aluno_analise" className="form-select" name="aluno" value={filters.aluno} onChange={updateFilter}>
                      <option value="">Seleccione quando necessário</option>
                      {filteredAlunos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="col-md-3">
                <label className="form-label" htmlFor="pct">PCT</label>
                <select id="pct" className="form-select" name="pct" value={filters.pct} onChange={updateFilter}>
                  <option value="">Todas</option>
                  {filteredPcts.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </div>
            </>
          )}
          {activeType === 'ocorrencias' && (
            <>
              <div className="col-md-3">
                <label className="form-label" htmlFor="aluno_ocorrencia">Aluno</label>
                <select id="aluno_ocorrencia" className="form-select" name="aluno" value={filters.aluno} onChange={updateFilter}>
                  <option value="">Todos</option>
                  {filteredAlunos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="categoria">Categoria</label>
                <select id="categoria" className="form-select" name="categoria" value={filters.categoria} onChange={updateFilter}>
                  <option value="">Todas</option>
                  {options.categorias_ocorrencia.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="tipo">Tipo</label>
                <select id="tipo" className="form-select" name="tipo" value={filters.tipo} onChange={updateFilter}>
                  <option value="">Todos</option>
                  {options.tipos_ocorrencia.map((item) => <option key={item.id} value={item.id}>{item.descricao}</option>)}
                </select>
              </div>
            </>
          )}
          {['controloAulas', 'ocorrencias', 'reunioes'].includes(activeType) && (
            <>
              <div className="col-md-3">
                <label className="form-label" htmlFor="data_inicio">Data Inicial</label>
                <input id="data_inicio" className="form-control" type="date" name="data_inicio" value={filters.data_inicio} onChange={updateFilter} />
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="data_fim">Data Final</label>
                <input id="data_fim" className="form-control" type="date" name="data_fim" value={filters.data_fim} onChange={updateFilter} />
              </div>
            </>
          )}
          {activeType === 'reunioes' && (
            <div className="col-md-4">
              <label className="form-label" htmlFor="search">Assunto ou Participantes</label>
              <input id="search" className="form-control" name="search" value={filters.search} onChange={updateFilter} placeholder="Pesquisar reuniões" />
            </div>
          )}
          <div className="col-md-auto">
            <button className="btn btn-primary w-100" type="button" onClick={generateReport} disabled={isLoading}>
              <i className="bi bi-file-earmark-text" /> {isLoading ? 'A gerar...' : 'Gerar Relatório'}
            </button>
          </div>
          <div className="col-md-auto">
            <button className="btn btn-outline-secondary w-100" type="button" onClick={() => setFilters(initialFilters)}>
              Limpar Filtros
            </button>
          </div>
        </div>
      </section>

      {!report && (
        <section className="empty-state no-print">
          <i className="bi bi-file-earmark-bar-graph" />
          <strong>Seleccione o tipo de relatório e gere o documento.</strong>
          <span>Os resultados serão apresentados apenas com dados reais existentes no SIGEP.</span>
        </section>
      )}

      {report && (
        <section className="panel-card report-print-area">
          <div className="report-print-header">
            <strong>SIGEP</strong>
            <span>Sistema de Gestão Pedagógica</span>
            <h2>{report.titulo || activeReport?.title}</h2>
            <p>Emitido em {new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</p>
          </div>

          <div className="summary-grid">
            {summaryEntries(report.resumo).map(([key, value]) => (
              <div className="metric-card compact" key={key}>
                <span>{humanizeKey(key)}</span>
                <strong>{formatValue(value)}</strong>
              </div>
            ))}
          </div>

          {Object.keys(report.filtros || {}).length > 0 && (
            <section className="report-section">
              <h3>Filtros Utilizados</h3>
              <DetailSection items={report.filtros} />
            </section>
          )}

          {activeType === 'desempenhoPCT' ? (
            <AnalysisSection analysis={report.analysis} />
          ) : (
            <div className="report-section-stack">
              {(report.seccoes || []).map((section, index) => <ReportSection section={section} key={`${section.titulo}-${index}`} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default RelatoriosPage;
