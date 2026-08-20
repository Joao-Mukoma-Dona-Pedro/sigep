import { useEffect, useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { getDashboardSummary } from '../services/dashboardService';

const emptySummary = {
  stats: [],
  charts: {},
  activities: [],
};

function getErrorMessage(error) {
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está activo.';
  if (error.response.status === 401) return 'A sua sessão expirou. Entre novamente no SIGEP.';
  return 'Ocorreu um erro ao carregar o Dashboard.';
}

function RealChart({ chart }) {
  if (!chart || !chart.total) {
    return (
      <article className="panel-card">
        <div className="panel-card-header">
          <h2>{chart?.title || 'Indicador'}</h2>
        </div>
        <p className="text-muted mb-0">Sem dados suficientes.</p>
      </article>
    );
  }

  return (
    <article className="panel-card">
      <div className="panel-card-header">
        <h2>{chart.title}</h2>
      </div>
      <div className="fake-chart" aria-label={chart.title}>
        {chart.items.map((item) => {
          const width = chart.total ? Math.round((item.value / chart.total) * 100) : 0;
          return (
            <div className="chart-row" key={item.label}>
              <span>{item.label}</span>
              <div className="chart-track">
                <div className="chart-bar tone-blue" style={{ width: `${width}%` }} />
              </div>
              <strong>{item.value}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function DashboardPage() {
  const [summary, setSummary] = useState(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getDashboardSummary();
        if (isMounted) setSummary(data);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <PageHeader title="Dashboard" breadcrumbs={['Dashboard']} />

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="stats-grid">
        {isLoading && <div className="text-muted">A carregar indicadores...</div>}
        {!isLoading && summary.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <RealChart chart={summary.charts.planificacoes} />
        <RealChart chart={summary.charts.aulas} />
        <RealChart chart={summary.charts.ocorrencias} />
      </section>

      <section className="panel-card">
        <div className="panel-card-header">
          <h2>Actividade Recente</h2>
          <i className="bi bi-clock-history" aria-hidden="true" />
        </div>
        {summary.activities.length === 0 ? (
          <p className="text-muted mb-0">Sem actividade recente.</p>
        ) : (
          <ul className="activity-list">
            {summary.activities.map((activity) => (
              <li key={`${activity.label}-${activity.date}-${activity.text}`}>
                <span className="activity-dot" />
                <span>{activity.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
