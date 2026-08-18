import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getReuniao } from '../services/reuniaoService';

function getErrorMessage(error) {
  if (!error.response) return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  if (error.response.status === 401) return 'A sua sessÃ£o expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'ReuniÃ£o nÃ£o encontrada.';
  return 'Ocorreu um erro ao carregar os dados da reuniÃ£o.';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO').format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function TextPanel({ title, text }) {
  return (
    <section className="panel-card">
      <div className="panel-card-header">
        <h2>{title}</h2>
      </div>
      <p className="mb-0 text-muted">{text || 'Sem informaÃ§Ã£o registada.'}</p>
    </section>
  );
}

function ReuniaoDetailPage() {
  const { id } = useParams();
  const [reuniao, setReuniao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadReuniao() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getReuniao(id);
        if (isMounted) setReuniao(data);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReuniao();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title={reuniao?.assunto || 'ReuniÃ£o'}
        breadcrumbs={['ReuniÃµes', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/reunioes">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar reuniÃ£o...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && reuniao && (
        <>
          <section className="detail-grid">
            <DetailItem label="Data" value={formatDate(reuniao.data)} />
            <DetailItem label="Assunto" value={reuniao.assunto} />
            <DetailItem label="Data de CriaÃ§Ã£o" value={formatDateTime(reuniao.created_at)} />
            <DetailItem label="Ãšltima AtualizaÃ§Ã£o" value={formatDateTime(reuniao.updated_at)} />
          </section>

          <TextPanel title="Participantes" text={reuniao.participantes} />
          <TextPanel title="DecisÃµes" text={reuniao.decisoes} />
          <TextPanel title="ObservaÃ§Ã£o" text={reuniao.observacao} />
        </>
      )}
    </div>
  );
}

export default ReuniaoDetailPage;
