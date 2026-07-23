import { moduleLinks, workflowSteps } from '../config/modules';

function DashboardPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Dashboard Principal</p>
          <h1>Gabinete Pedagogico</h1>
        </div>
        <span className="status-pill">Acesso administrativo</span>
      </section>

      <section className="module-grid">
        {moduleLinks.map((module) => (
          <article className="module-card" key={module.path}>
            <span className={`module-dot ${module.color}`} />
            <h3>{module.label}</h3>
            <p>Estrutura preparada.</p>
          </article>
        ))}
      </section>

      <section className="workflow-panel">
        <div>
          <p className="eyebrow">Fluxo de Trabalho</p>
          <h2>Sequencia pedagogica de referencia</h2>
        </div>
        <ol>
          {workflowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default DashboardPage;
