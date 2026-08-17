import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import {
  getAnoLectivoAnalysis,
  getClasseAnalysis,
  getIndividualAnalysis,
  getTurmaAnalysis,
  listAnalysisAlunos,
  listAnalysisLecionacoes,
  listAnalysisPCT,
} from '../services/pctAnalysisService';

const modes = [
  { value: 'individual', label: 'Individual', icon: 'bi-person-lines-fill' },
  { value: 'turma', label: 'Turma', icon: 'bi-grid-3x3-gap' },
  { value: 'classe', label: 'Classe', icon: 'bi-columns-gap' },
  { value: 'ano', label: 'Ano Lectivo', icon: 'bi-calendar3' },
];

const initialFilters = {
  ano_lectivo: '',
  aluno: '',
  classe: '',
  turma: '',
  disciplina: '',
  trimestre: '',
  pct: '',
};

function getErrorMessage(error) {
  if (!error.response) {
    return 'Nao foi possivel conectar ao servidor. Verifique se o backend esta ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 400) {
    const data = error.response.data;
    if (data?.detail) return data.detail;
    const firstField = Object.keys(data || {})[0];
    const firstMessage = firstField ? data[firstField]?.[0] : null;
    return firstMessage || 'Verifique os filtros da analise.';
  }

  return 'Ocorreu um erro inesperado ao carregar a analise.';
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '-';
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 2 }).format(Number(value));
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '-';
  return `${formatNumber(value)}%`;
}

function formatTrimestre(value) {
  const labels = {
    1: 'PCT1',
    2: 'PCT2',
    3: 'PCT3',
  };
  return labels[value] || '-';
}

function StatPanel({ label, value, icon = 'bi-graph-up' }) {
  return (
    <article className="stat-card tone-blue">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <i className={`bi ${icon}`} aria-hidden="true" />
    </article>
  );
}

function EmptyAnalysis() {
  return (
    <section className="empty-state">
      <h2>Selecione os filtros e execute a analise.</h2>
      <p className="mb-0 text-muted">
        Os indicadores serao calculados com dados reais de Resultados PCT.
      </p>
    </section>
  );
}

function Alerts({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="alert alert-warning mb-0">
      {items.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </div>
  );
}

function LineChart({ title, data, valueKey = 'nota' }) {
  const points = data.filter((item) => item[valueKey] !== null && item[valueKey] !== undefined);

  if (!points.length) {
    return (
      <section className="empty-state">
        <h2>{title}</h2>
        <p className="mb-0 text-muted">Sem dados suficientes para apresentar o grafico.</p>
      </section>
    );
  }

  const width = 640;
  const height = 220;
  const padding = 32;
  const maxValue = Math.max(20, ...points.map((item) => Number(item[valueKey])));
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coords = points.map((item, index) => {
    const x = padding + index * xStep;
    const y = height - padding - (Number(item[valueKey]) / maxValue) * (height - padding * 2);
    return { ...item, x, y };
  });
  const polyline = coords.map((item) => `${item.x},${item.y}`).join(' ');

  return (
    <article className="panel-card analysis-chart-card">
      <div className="panel-card-header">
        <h2>{title}</h2>
        <span className="sigep-badge badge-info">Linha</span>
      </div>
      <svg className="analysis-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chart-axis" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chart-axis" />
        <polyline points={polyline} className="line-series" />
        {coords.map((item) => (
          <g key={`${item.trimestre || item.label}-${item.x}`}>
            <circle cx={item.x} cy={item.y} r="5" className="line-point" />
            <text x={item.x} y={item.y - 10} textAnchor="middle" className="chart-label">{formatNumber(item[valueKey])}</text>
            <text x={item.x} y={height - 10} textAnchor="middle" className="chart-label">
              {item.trimestre_label || item.label || formatTrimestre(item.trimestre)}
            </text>
          </g>
        ))}
      </svg>
    </article>
  );
}

function BarChart({ title, data, labelKey, valueKey = 'media', valueSuffix = '' }) {
  const rows = data.filter((item) => item[valueKey] !== null && item[valueKey] !== undefined);
  const maxValue = Math.max(1, ...rows.map((item) => Number(item[valueKey])));

  if (!rows.length) {
    return (
      <section className="empty-state">
        <h2>{title}</h2>
        <p className="mb-0 text-muted">Sem dados suficientes para apresentar o grafico.</p>
      </section>
    );
  }

  return (
    <article className="panel-card">
      <div className="panel-card-header">
        <h2>{title}</h2>
        <span className="sigep-badge badge-info">Barras</span>
      </div>
      <div className="analysis-bars">
        {rows.map((item) => {
          const label = typeof labelKey === 'function' ? labelKey(item) : item[labelKey];
          const width = Math.max(4, (Number(item[valueKey]) / maxValue) * 100);
          return (
            <div className="analysis-bar-row" key={label}>
              <span>{label}</span>
              <div className="chart-track">
                <div className="chart-bar tone-blue" style={{ width: `${width}%` }} />
              </div>
              <strong>{formatNumber(item[valueKey])}{valueSuffix}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function SummaryCards({ summary, mode }) {
  if (!summary) return null;

  const items = [
    { label: mode === 'turma' ? 'Media da turma' : 'Media', value: formatNumber(summary.media), icon: 'bi-calculator' },
    { label: 'Maior nota', value: formatNumber(summary.maior_nota), icon: 'bi-arrow-up-circle' },
    { label: 'Menor nota', value: formatNumber(summary.menor_nota), icon: 'bi-arrow-down-circle' },
    { label: 'Resultados', value: formatNumber(summary.quantidade_resultados), icon: 'bi-list-check' },
  ];

  if (mode === 'turma') {
    items.push(
      { label: 'Alunos esperados', value: formatNumber(summary.alunos_esperados), icon: 'bi-people' },
      { label: 'Alunos sem resultado', value: formatNumber(summary.alunos_sem_resultado), icon: 'bi-person-dash' },
      { label: 'Lancamento', value: formatPercent(summary.percentual_lancamento), icon: 'bi-percent' },
    );
  }

  if (mode === 'classe' || mode === 'ano') {
    items.push(
      { label: 'Esperados', value: formatNumber(summary.resultados_esperados), icon: 'bi-clipboard-data' },
      { label: 'Cobertura', value: formatPercent(summary.percentual_lancamento), icon: 'bi-percent' },
    );
  }

  return (
    <section className="stats-grid">
      {items.map((item) => <StatPanel key={item.label} {...item} />)}
    </section>
  );
}

function groupIndividualRows(rows = []) {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.disciplina || 'Disciplina';
    if (!grouped.has(key)) {
      grouped.set(key, { disciplina: key, pct1: null, pct2: null, pct3: null });
    }
    grouped.get(key)[`pct${row.trimestre}`] = row.nota;
  });

  return Array.from(grouped.values()).map((row) => {
    const values = [row.pct1, row.pct2, row.pct3].filter((value) => value !== null && value !== undefined);
    return {
      ...row,
      media: values.length ? values.reduce((total, value) => total + Number(value), 0) / values.length : null,
      evolucao: row.pct3 !== null && row.pct1 !== null ? row.pct3 - row.pct1 : null,
    };
  });
}

function notesByTrimester(notes = []) {
  const values = { pct1: null, pct2: null, pct3: null };
  notes.forEach((item) => {
    values[`pct${item.trimestre}`] = item.nota;
  });
  return values;
}

function ResultsTable({ mode, data }) {
  if (!data) return null;

  if (mode === 'individual') {
    const rows = groupIndividualRows(data.tabela);
    return (
      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>PCT1</th>
                <th>PCT2</th>
                <th>PCT3</th>
                <th>Media</th>
                <th>Evolucao</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.disciplina}>
                  <td><strong>{row.disciplina}</strong></td>
                  <td>{formatNumber(row.pct1)}</td>
                  <td>{formatNumber(row.pct2)}</td>
                  <td>{formatNumber(row.pct3)}</td>
                  <td>{formatNumber(row.media)}</td>
                  <td>{formatNumber(row.evolucao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (mode === 'turma') {
    return (
      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>N.</th>
                <th>PCT1</th>
                <th>PCT2</th>
                <th>PCT3</th>
                <th>Media</th>
                <th>Situacao</th>
              </tr>
            </thead>
            <tbody>
              {data.tabela.map((row) => {
                const notes = notesByTrimester(row.notas);
                return (
                  <tr key={row.aluno.id}>
                    <td><strong>{row.aluno.nome}</strong></td>
                    <td>{row.aluno.numero ?? '-'}</td>
                    <td>{formatNumber(notes.pct1)}</td>
                    <td>{formatNumber(notes.pct2)}</td>
                    <td>{formatNumber(notes.pct3)}</td>
                    <td>{formatNumber(row.media)}</td>
                    <td>
                      <span className={`sigep-badge ${row.situacao === 'com resultado' ? 'badge-success' : 'badge-warning'}`}>
                        {row.situacao}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (mode === 'classe') {
    return (
      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Turma</th>
                <th>Alunos esperados</th>
                <th>Resultados</th>
                <th>Cobertura</th>
                <th>Media</th>
                <th>Evolucao</th>
              </tr>
            </thead>
            <tbody>
              {data.comparacao_turmas.map((row) => (
                <tr key={row.turma.id}>
                  <td><strong>{row.turma.nome}</strong></td>
                  <td>{formatNumber(row.alunos_esperados)}</td>
                  <td>{formatNumber(row.quantidade_resultados)}</td>
                  <td>{formatPercent(row.percentual_lancamento)}</td>
                  <td>{formatNumber(row.media)}</td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-grid two-columns">
      <article className="panel-card">
        <div className="panel-card-header"><h2>Desempenho por Classe</h2></div>
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead><tr><th>Classe</th><th>Resultados</th><th>Media</th></tr></thead>
            <tbody>
              {data.desempenho_por_classe.map((row) => (
                <tr key={row.classe}>
                  <td><strong>{row.classe}</strong></td>
                  <td>{formatNumber(row.quantidade_resultados)}</td>
                  <td>{formatNumber(row.media)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <article className="panel-card">
        <div className="panel-card-header"><h2>Desempenho por Disciplina</h2></div>
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead><tr><th>Disciplina</th><th>Resultados</th><th>Media</th></tr></thead>
            <tbody>
              {data.desempenho_por_disciplina.map((row) => (
                <tr key={row.disciplina.id}>
                  <td><strong>{row.disciplina.nome}</strong></td>
                  <td>{formatNumber(row.quantidade_resultados)}</td>
                  <td>{formatNumber(row.media)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function Charts({ mode, data }) {
  if (!data) return null;

  if (mode === 'individual') {
    return <LineChart title="Evolucao das notas por PCT" data={data.evolucao || []} valueKey="nota" />;
  }

  if (mode === 'turma') {
    return (
      <section className="dashboard-grid two-columns">
        <BarChart title="Distribuicao das notas" data={data.distribuicao_notas || []} labelKey="faixa" valueKey="quantidade" />
        <LineChart title="Evolucao da media da turma" data={data.evolucao_media || []} valueKey="media" />
      </section>
    );
  }

  if (mode === 'classe') {
    return (
      <BarChart
        title="Media por turma"
        data={data.media_por_turma || []}
        labelKey={(row) => row.turma.nome}
        valueKey="media"
      />
    );
  }

  return (
    <section className="dashboard-grid two-columns">
      <BarChart title="Media por classe" data={data.desempenho_por_classe || []} labelKey="classe" valueKey="media" />
      <LineChart title="Evolucao por trimestre" data={data.evolucao_por_trimestre || []} valueKey="media" />
    </section>
  );
}

function PctAnalysisPage() {
  const [mode, setMode] = useState('individual');
  const [filters, setFilters] = useState(initialFilters);
  const [lecionacoes, setLecionacoes] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [pcts, setPcts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [error, setError] = useState('');

  const anos = useMemo(
    () => [...new Set(lecionacoes.map((item) => item.ano_lectivo).filter(Boolean))].sort(),
    [lecionacoes],
  );
  const classes = useMemo(
    () => [...new Set(lecionacoes.map((item) => item.turma_classe).filter(Boolean))].sort(),
    [lecionacoes],
  );
  const turmas = useMemo(() => {
    const filtered = filters.classe
      ? lecionacoes.filter((item) => item.turma_classe === filters.classe)
      : lecionacoes;
    return Array.from(new Map(filtered.map((item) => [item.turma_id, item])).values());
  }, [filters.classe, lecionacoes]);
  const disciplinas = useMemo(
    () => Array.from(new Map(lecionacoes.map((item) => [item.disciplina_id, item])).values()),
    [lecionacoes],
  );
  const filteredAlunos = useMemo(() => {
    if (filters.turma) {
      return alunos.filter((item) => String(item.turma) === String(filters.turma));
    }
    if (filters.classe) {
      return alunos.filter((item) => item.turma_info?.classe === filters.classe);
    }
    return alunos;
  }, [alunos, filters.classe, filters.turma]);
  const filteredPcts = useMemo(() => pcts.filter((item) => {
    if (filters.ano_lectivo && item.lecionacao_info?.ano_lectivo !== filters.ano_lectivo) return false;
    if (filters.classe && item.lecionacao_info?.turma_classe !== filters.classe) return false;
    if (filters.turma && String(item.lecionacao_info?.turma_id) !== String(filters.turma)) return false;
    if (filters.disciplina && String(item.lecionacao_info?.disciplina_id) !== String(filters.disciplina)) return false;
    if (filters.trimestre && String(item.trimestre) !== String(filters.trimestre)) return false;
    return true;
  }), [filters, pcts]);

  useEffect(() => {
    async function loadOptions() {
      setIsLoadingOptions(true);
      setError('');

      try {
        const [lecionacoesData, alunosData, pctsData] = await Promise.all([
          listAnalysisLecionacoes(),
          listAnalysisAlunos(),
          listAnalysisPCT(),
        ]);
        setLecionacoes(lecionacoesData);
        setAlunos(alunosData);
        setPcts(pctsData);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setAnalysis(null);
    setError('');
    setFilters(initialFilters);
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function buildParams() {
    const params = { ...filters };
    if (mode === 'ano') {
      delete params.aluno;
      delete params.turma;
    }
    if (mode === 'classe') {
      delete params.aluno;
      delete params.turma;
    }
    if (mode === 'turma') {
      delete params.aluno;
    }
    return params;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const params = buildParams();
      const actions = {
        individual: getIndividualAnalysis,
        turma: getTurmaAnalysis,
        classe: getClasseAnalysis,
        ano: getAnoLectivoAnalysis,
      };
      const data = await actions[mode](params);
      setAnalysis(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  const hasResults = analysis?.resumo?.quantidade_resultados > 0;

  return (
    <div className="page-stack">
      <PageHeader
        title="Analise de Desempenho PCT"
        eyebrow="Provas Comuns Trimestrais"
        description="Analise administrativa dos resultados das PCT por aluno, turma, classe e ano lectivo."
        breadcrumbs={['Analise PCT']}
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="analysis-mode-switch" aria-label="Nivel de analise">
        {modes.map((item) => (
          <button
            className={`analysis-mode-button ${mode === item.value ? 'active' : ''}`}
            key={item.value}
            type="button"
            onClick={() => handleModeChange(item.value)}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </section>

      <form className="panel-card" onSubmit={handleSubmit}>
        <div className="panel-card-header">
          <div>
            <h2>Filtros</h2>
            <p className="mb-0 text-muted">Selecione o contexto pedagogico da analise.</p>
          </div>
          <button className="btn btn-primary" type="submit" disabled={isLoading || isLoadingOptions}>
            <i className="bi bi-play-circle" />
            {isLoading ? 'A analisar...' : 'Executar Analise'}
          </button>
        </div>

        <div className="analysis-filters">
          <div>
            <label className="form-label" htmlFor="ano_lectivo">Ano Lectivo</label>
            <select id="ano_lectivo" className="form-select" name="ano_lectivo" value={filters.ano_lectivo} onChange={handleFilterChange} required>
              <option value="">Selecione</option>
              {anos.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          {(mode === 'turma' || mode === 'classe' || mode === 'ano') && (
            <div>
              <label className="form-label" htmlFor="classe">Classe</label>
              <select id="classe" className="form-select" name="classe" value={filters.classe} onChange={handleFilterChange} required={mode !== 'ano'}>
                <option value="">Todas</option>
                {classes.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          )}

          {mode === 'turma' && (
            <div>
              <label className="form-label" htmlFor="turma">Turma</label>
              <select id="turma" className="form-select" name="turma" value={filters.turma} onChange={handleFilterChange} required>
                <option value="">Selecione</option>
                {turmas.map((item) => <option key={item.turma_id} value={item.turma_id}>{item.turma}</option>)}
              </select>
            </div>
          )}

          {mode === 'individual' && (
            <div>
              <label className="form-label" htmlFor="aluno">Aluno</label>
              <select id="aluno" className="form-select" name="aluno" value={filters.aluno} onChange={handleFilterChange} required>
                <option value="">Selecione</option>
                {filteredAlunos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="form-label" htmlFor="disciplina">Disciplina</label>
            <select id="disciplina" className="form-select" name="disciplina" value={filters.disciplina} onChange={handleFilterChange}>
              <option value="">Todas</option>
              {disciplinas.map((item) => <option key={item.disciplina_id} value={item.disciplina_id}>{item.disciplina}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="trimestre">Trimestre</label>
            <select id="trimestre" className="form-select" name="trimestre" value={filters.trimestre} onChange={handleFilterChange}>
              <option value="">Todos</option>
              <option value="1">PCT1</option>
              <option value="2">PCT2</option>
              <option value="3">PCT3</option>
            </select>
          </div>

          {mode !== 'ano' && (
            <div>
              <label className="form-label" htmlFor="pct">PCT especifica</label>
              <select id="pct" className="form-select" name="pct" value={filters.pct} onChange={handleFilterChange}>
                <option value="">Todas</option>
                {filteredPcts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatTrimestre(item.trimestre)} - {item.lecionacao_info?.disciplina} - {item.lecionacao_info?.turma}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </form>

      {!analysis && !isLoading && <EmptyAnalysis />}
      {isLoading && (
        <section className="empty-state">
          <h2>A carregar analise...</h2>
        </section>
      )}

      {analysis && (
        <>
          <Alerts items={analysis.avisos || []} />
          <SummaryCards summary={analysis.resumo} mode={mode} />

          {hasResults ? (
            <>
              <Charts mode={mode} data={analysis} />
              <ResultsTable mode={mode} data={analysis} />
            </>
          ) : (
            <section className="empty-state">
              <h2>Sem resultados para os filtros selecionados.</h2>
              <p className="mb-0 text-muted">A analise nao considera alunos sem nota como zero.</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default PctAnalysisPage;
