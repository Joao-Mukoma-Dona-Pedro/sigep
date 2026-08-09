import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';

function DetailPage({ title, records, fields, backPath }) {
  const { id } = useParams();
  const record = records.find((item) => item.id === id) || records[0];

  return (
    <div className="page-stack">
      <PageHeader
        title={record?.nome || record?.classe || title}
        eyebrow="Detalhes"
        description="Pagina visual preparada para dados completos da API."
        breadcrumbs={[title, record?.id || id]}
        actions={<Link className="btn btn-outline-secondary" to={backPath}>Voltar</Link>}
      />
      <section className="detail-grid">
        {fields.map((field) => (
          <article className="detail-item" key={field.key}>
            <span>{field.label}</span>
            <strong>{record?.[field.key] ?? '-'}</strong>
          </article>
        ))}
      </section>
      <section className="panel-card">
        <div className="panel-card-header">
          <h2>Resumo pedagogico</h2>
          <span className="badge sigep-badge badge-info">Preparado</span>
        </div>
        <p className="mb-0 text-muted">
          Esta area recebera historico, anexos, observacoes e indicadores quando a API do modulo for implementada.
        </p>
      </section>
    </div>
  );
}

export default DetailPage;
