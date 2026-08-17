import PageHeader from '../components/ui/PageHeader';

const reports = [
  { title: 'Relatorio por turma', icon: 'bi-grid-3x3-gap', description: 'Resumo de alunos, ocorrencias, aulas e PCT por turma.' },
  { title: 'Relatório por professor', icon: 'bi-person-badge', description: 'Planificações, aulas assistidas, PCT e histórico pedagógico.' },
  { title: 'Relatorio por disciplina', icon: 'bi-journal-bookmark', description: 'Indicadores por disciplina, classe e trimestre.' },
];

function ReportsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Relatorios"
        eyebrow="Impressao e exportacao"
        description="Interface preparada para consultas, PDF e Excel."
        breadcrumbs={['Relatorios']}
        actions={(
          <div className="button-cluster">
            <button className="btn btn-outline-secondary" type="button"><i className="bi bi-filetype-pdf" /> Exportar PDF</button>
            <button className="btn btn-outline-secondary" type="button"><i className="bi bi-file-earmark-spreadsheet" /> Exportar Excel</button>
          </div>
        )}
      />
      <section className="report-grid">
        {reports.map((report) => (
          <article className="report-card" key={report.title}>
            <i className={`bi ${report.icon}`} aria-hidden="true" />
            <h2>{report.title}</h2>
            <p>{report.description}</p>
            <button className="btn btn-primary btn-sm" type="button">Preparar consulta</button>
          </article>
        ))}
      </section>
      <section className="panel-card">
        <div className="panel-card-header">
          <h2>Filtros do relatorio</h2>
        </div>
        <div className="row g-3">
          <div className="col-md-4"><select className="form-select"><option>Turma</option></select></div>
          <div className="col-md-4"><select className="form-select"><option>Professor</option></select></div>
          <div className="col-md-4"><select className="form-select"><option>Disciplina</option></select></div>
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;
