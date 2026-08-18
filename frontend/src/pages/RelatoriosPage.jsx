import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import { getRelatorio, listRelatorioOptions } from '../services/relatorioService';

const reportTypes = [
  { key: 'professores', title: 'Relatório de Professores', icon: 'bi-person-badge', description: 'Professores e lecionações associadas.' },
  { key: 'turmas', title: 'Relatório de Turmas', icon: 'bi-grid-3x3-gap', description: 'Turmas, diretores e quantidade de alunos.' },
  { key: 'alunos', title: 'Relatório de Alunos', icon: 'bi-mortarboard', description: 'Alunos por turma, classe e estado.' },
  { key: 'planificacoes', title: 'Relatório de Planificações', icon: 'bi-journal-check', description: 'Entrega das planificações dos professores.' },
  { key: 'controloAulas', title: 'Relatório de Controlo de Aulas', icon: 'bi-calendar2-check', description: 'Aulas controladas e assistidas.' },
  { key: 'pct', title: 'Relatório PCT', icon: 'bi-file-earmark-text', description: 'Provas Comuns Trimestrais e estado das notas.' },
  { key: 'desempenhoPCT', title: 'Relatório de Desempenho PCT', icon: 'bi-graph-up-arrow', description: 'Indicadores calculados a partir dos Resultados PCT.' },
  { key: 'ocorrencias', title: 'Relatório de Ocorrências', icon: 'bi-exclamation-triangle', description: 'Ocorrências por aluno, turma, tipo e categoria.' },
  { key: 'reunioes', title: 'Relatório de Reuniões', icon: 'bi-people', description: 'Registos administrativos das reuniões pedagógicas.' },
];

const columnsByType = {
  professores: [
    ['nome', 'Nome'],
    ['telefone', 'Telefone'],
    ['email', 'E-mail'],
    ['estado', 'Estado'],
    ['data_entrada', 'Data de Entrada'],
    ['lecionacoes', 'Lecionações'],
  ],
  turmas: [
    ['classe', 'Classe'],
    ['sala', 'Turma/Sala'],
    ['ano_lectivo', 'Ano Lectivo'],
    ['diretor_turma', 'Diretor de Turma'],
    ['quantidade_alunos', 'Alunos'],
    ['capacidade', 'Capacidade'],
    ['estado', 'Estado'],
  ],
  alunos: [
    ['numero', 'Número'],
    ['nome', 'Nome'],
    ['turma', 'Turma'],
    ['classe', 'Classe'],
    ['estado', 'Estado'],
    ['encarregado_educacao', 'Encarregado de Educação'],
  ],
  planificacoes: [
    ['professor', 'Professor'],
    ['trimestre', 'Trimestre'],
    ['data_entrega', 'Data de Entrega'],
    ['situacao_entrega', 'Situação'],
    ['observacao', 'Observação'],
  ],
  controloAulas: [
    ['professor', 'Professor'],
    ['disciplina', 'Disciplina'],
    ['turma', 'Turma'],
    ['ano_lectivo', 'Ano Lectivo'],
    ['data', 'Data'],
    ['aula_assistida', 'Aula Assistida'],
    ['observacao', 'Observação'],
  ],
  pct: [
    ['professor', 'Professor'],
    ['disciplina', 'Disciplina'],
    ['turma', 'Turma'],
    ['classe', 'Classe'],
    ['ano_lectivo', 'Ano Lectivo'],
    ['trimestre', 'Trimestre'],
    ['data_aplicacao', 'Data de Aplicação'],
    ['estado_notas', 'Estado das Notas'],
    ['cobertura', 'Cobertura (%)'],
  ],
  ocorrencias: [
    ['aluno', 'Aluno'],
    ['turma', 'Turma'],
    ['classe', 'Classe'],
    ['data', 'Data'],
    ['tipo', 'Tipo'],
    ['categoria', 'Categoria'],
    ['descricao', 'Descrição'],
    ['medida_tomada', 'Medida Tomada'],
    ['registada_por', 'Registada Por'],
  ],
  reunioes: [
    ['data', 'Data'],
    ['assunto', 'Assunto'],
    ['participantes', 'Participantes'],
    ['decisoes', 'Decisões'],
    ['observacao', 'Observação'],
  ],
};

const initialFilters = {
  ano_lectivo: '',
  classe: '',
  turma: '',
  aluno: '',
  professor: '',
  disciplina: '',
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
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
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
  return String(value);
}

function summaryEntries(summary = {}) {
  return Object.entries(summary).filter(([, value]) => !Array.isArray(value) && typeof value !== 'object');
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

function RelatoriosPage() {
  const [activeType, setActiveType] = useState('professores');
  const [filters, setFilters] = useState(initialFilters);
  const [options, setOptions] = useState({
    anos_lectivos: [],
    classes: [],
    professores: [],
    disciplinas: [],
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

  const rows = activeType === 'desempenhoPCT'
    ? report?.analysis?.tabela || report?.analysis?.media_por_turma || report?.analysis?.desempenho_por_classe || []
    : report?.rows || [];
  const columns = columnsByType[activeType] || [];

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
      }
      if (name === 'classe') {
        next.turma = '';
        next.aluno = '';
        next.pct = '';
      }
      if (name === 'turma') {
        next.aluno = '';
        next.pct = '';
      }
      return next;
    });
  }

  function cleanFilters() {
    const allowedByType = {
      professores: ['estado', 'disciplina', 'turma', 'ano_lectivo'],
      turmas: ['ano_lectivo', 'classe', 'estado'],
      alunos: ['ano_lectivo', 'classe', 'turma', 'estado'],
      planificacoes: ['professor', 'trimestre', 'entregou'],
      controloAulas: ['ano_lectivo', 'professor', 'disciplina', 'turma', 'data_inicio', 'data_fim'],
      pct: ['ano_lectivo', 'professor', 'disciplina', 'turma', 'classe', 'trimestre'],
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

  function handleExportCsv() {
    if (!columns.length || !rows.length) return;
    downloadCsv(`${activeType}-sigep.csv`, buildCsv(columns, rows));
  }

  function handlePrint() {
    window.print();
  }

  function changeReportType(type) {
    setActiveType(type);
    setReport(null);
    setError('');
  }

  return (
    <div className="page-stack reports-page">
      <PageHeader
        title="Relatórios"
        eyebrow="Consulta e Exportação"
        description="Relatórios administrativos e pedagógicos gerados a partir dos dados reais do SIGEP."
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

      <section className="report-grid no-print">
        {reportTypes.map((item) => (
          <button
            className={`report-card text-start ${activeType === item.key ? 'active' : ''}`}
            key={item.key}
            type="button"
            onClick={() => changeReportType(item.key)}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </button>
        ))}
      </section>

      <section className="panel-card no-print">
        <div className="panel-card-header">
          <h2>Filtros do Relatório</h2>
          <span>{activeReport?.title}</span>
        </div>
        <div className="row g-3">
          {['professores', 'turmas', 'alunos', 'controloAulas', 'pct', 'desempenhoPCT', 'ocorrencias'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="ano_lectivo">Ano Lectivo</label>
              <select id="ano_lectivo" className="form-select" name="ano_lectivo" value={filters.ano_lectivo} onChange={updateFilter}>
                <option value="">Todos</option>
                {options.anos_lectivos.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          )}
          {['turmas', 'alunos', 'pct', 'desempenhoPCT', 'ocorrencias'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="classe">Classe</label>
              <select id="classe" className="form-select" name="classe" value={filters.classe} onChange={updateFilter}>
                <option value="">Todas</option>
                {options.classes.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          )}
          {['professores', 'alunos', 'controloAulas', 'pct', 'desempenhoPCT', 'ocorrencias'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="turma">Turma</label>
              <select id="turma" className="form-select" name="turma" value={filters.turma} onChange={updateFilter}>
                <option value="">Todas</option>
                {filteredTurmas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {['professores', 'controloAulas', 'pct'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="professor">Professor</label>
              <select id="professor" className="form-select" name="professor" value={filters.professor} onChange={updateFilter}>
                <option value="">Todos</option>
                {options.professores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}
          {['professores', 'controloAulas', 'pct', 'desempenhoPCT'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="disciplina">Disciplina</label>
              <select id="disciplina" className="form-select" name="disciplina" value={filters.disciplina} onChange={updateFilter}>
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
          {['professores', 'turmas', 'alunos'].includes(activeType) && (
            <div className="col-md-3">
              <label className="form-label" htmlFor="estado">Estado</label>
              <select id="estado" className="form-select" name="estado" value={filters.estado} onChange={updateFilter}>
                <option value="">Todos</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          )}
          {activeType === 'planificacoes' && (
            <>
              <div className="col-md-3">
                <label className="form-label" htmlFor="professor_plan">Professor</label>
                <select id="professor_plan" className="form-select" name="professor" value={filters.professor} onChange={updateFilter}>
                  <option value="">Todos</option>
                  {options.professores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label" htmlFor="entregou">Entrega</label>
                <select id="entregou" className="form-select" name="entregou" value={filters.entregou} onChange={updateFilter}>
                  <option value="">Todas</option>
                  <option value="true">Entregues</option>
                  <option value="false">Não entregues</option>
                </select>
              </div>
            </>
          )}
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
                <label className="form-label" htmlFor="aluno">Aluno</label>
                <select id="aluno" className="form-select" name="aluno" value={filters.aluno} onChange={updateFilter}>
                  <option value="">Selecione quando necessário</option>
                  {filteredAlunos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </div>
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
        </div>
        <div className="button-cluster mt-3">
          <button className="btn btn-primary" type="button" onClick={generateReport} disabled={isLoading}>
            <i className="bi bi-search" /> {isLoading ? 'A gerar...' : 'Gerar Relatório'}
          </button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => setFilters(initialFilters)}>
            Limpar Filtros
          </button>
        </div>
      </section>

      {report && (
        <section className="panel-card report-print-area">
          <div className="report-print-header">
            <strong>SIGEP</strong>
            <span>Sistema de Gestão Pedagógica</span>
            <h2>{report.titulo}</h2>
            <p>Gerado em {new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</p>
          </div>

          <div className="summary-grid">
            {summaryEntries(report.resumo).map(([key, value]) => (
              <div className="metric-card compact" key={key}>
                <span>{key.replaceAll('_', ' ')}</span>
                <strong>{formatValue(value)}</strong>
              </div>
            ))}
          </div>

          {activeType === 'desempenhoPCT' ? (
            <pre className="report-analysis-json">{JSON.stringify(report.analysis, null, 2)}</pre>
          ) : (
            <div className="table-responsive">
              <table className="table sigep-table align-middle">
                <thead>
                  <tr>
                    {columns.map(([key, label]) => <th key={key}>{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={columns.length} className="text-center text-muted py-4">Nenhum registo encontrado.</td></tr>}
                  {rows.map((row, index) => (
                    <tr key={`${activeType}-${index}`}>
                      {columns.map(([key]) => <td key={key}>{formatValue(row[key])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default RelatoriosPage;
