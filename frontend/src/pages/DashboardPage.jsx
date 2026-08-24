import { useEffect, useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import DonutChart from '../components/charts/DonutChart';
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
  const colors = ['#22c55e', '#f59e0b', '#ef4444', '#1263e6', '#854bd6'];
  return <DonutChart
    title={chart?.title || 'Indicador'}
    subtitle="Dados registados no SIGEP"
    data={(chart?.items || []).map((item, index) => ({ ...item, color: colors[index % colors.length] }))}
  />;
}

function DashboardPage() {
  const [summary, setSummary] = useState(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [refreshKey]);

  return (
    <div className="page-stack">
      <PageHeader title="Dashboard" breadcrumbs={['Dashboard']} actions={(
        <button className="btn btn-primary" type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={isLoading}>
          <i className={`bi bi-arrow-clockwise ${isLoading ? 'spin' : ''}`} aria-hidden="true" />
          {isLoading ? 'A actualizar...' : 'Actualizar'}
        </button>
      )} />

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
