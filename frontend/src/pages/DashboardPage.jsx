import CalendarPanel from '../components/ui/CalendarPanel';
import FakeChart from '../components/ui/FakeChart';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { dashboardStats } from '../config/modules';
import { activities, notices } from '../config/mockData';

function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Dashboard Principal"
        eyebrow="Gabinete Pedagogico"
        description="Resumo visual das atividades pedagogicas, preparado para receber indicadores reais da API."
        breadcrumbs={['Dashboard']}
      />

      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="dashboard-grid">
        <FakeChart
          title="Planificacoes por estado"
          bars={[
            { label: 'Entregues', value: 78, tone: 'green' },
            { label: 'Pendentes', value: 22, tone: 'orange' },
            { label: 'Em revisao', value: 35, tone: 'purple' },
          ]}
        />
        <FakeChart
          title="Ocorrencias por categoria"
          bars={[
            { label: 'Disciplinar', value: 42, tone: 'red' },
            { label: 'Academica', value: 30, tone: 'blue' },
            { label: 'Comportamental', value: 28, tone: 'yellow' },
          ]}
        />
        <CalendarPanel />
      </section>

      <section className="dashboard-grid two-columns">
        <article className="panel-card">
          <div className="panel-card-header">
            <h2>Ultimas Atividades</h2>
            <i className="bi bi-clock-history" aria-hidden="true" />
          </div>
          <ul className="activity-list">
            {activities.map((activity) => (
              <li key={activity}>
                <span className="activity-dot" />
                {activity}
              </li>
            ))}
          </ul>
        </article>
        <article className="panel-card">
          <div className="panel-card-header">
            <h2>Avisos</h2>
            <i className="bi bi-megaphone" aria-hidden="true" />
          </div>
          <div className="alert-list">
            {notices.map((notice) => (
              <div className="alert alert-warning mb-0" key={notice}>
                {notice}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardPage;
