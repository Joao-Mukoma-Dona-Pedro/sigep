import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getReuniao } from '../services/reuniaoService';

function getErrorMessage(error) {
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  if (error.response.status === 401) return 'A sua sessão expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'Reunião não encontrada.';
  return 'Ocorreu um erro ao carregar os dados da reunião.';
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
      <p className="mb-0 text-muted">{text || 'Sem informação registada.'}</p>
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
        title={reuniao?.assunto || 'Reunião'}
        eyebrow="Detalhes da Reunião"
        description="Consulta do registo administrativo da reunião pedagógica."
        breadcrumbs={['Reuniões', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/reunioes">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar reunião...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && reuniao && (
        <>
          <section className="detail-grid">
            <DetailItem label="Data" value={formatDate(reuniao.data)} />
            <DetailItem label="Assunto" value={reuniao.assunto} />
            <DetailItem label="Data de Criação" value={formatDateTime(reuniao.created_at)} />
            <DetailItem label="Última Atualização" value={formatDateTime(reuniao.updated_at)} />
          </section>

          <TextPanel title="Participantes" text={reuniao.participantes} />
          <TextPanel title="Decisões" text={reuniao.decisoes} />
          <TextPanel title="Observação" text={reuniao.observacao} />
        </>
      )}
    </div>
  );
}

export default ReuniaoDetailPage;
