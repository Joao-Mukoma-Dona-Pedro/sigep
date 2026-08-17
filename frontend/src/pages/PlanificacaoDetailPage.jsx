import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getPlanificacao } from '../services/planificacaoService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Planificacao nao encontrada.';
  }

  return 'Ocorreu um erro ao carregar os dados da planificacao.';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO').format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTrimestre(value) {
  const labels = {
    1: '1o Trimestre',
    2: '2o Trimestre',
    3: '3o Trimestre',
  };
  return labels[value] || '-';
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function PlanificacaoDetailPage() {
  const { id } = useParams();
  const [planificacao, setPlanificacao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPlanificacao() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getPlanificacao(id);
        if (isMounted) {
          setPlanificacao(data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPlanificacao();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Planificacao"
        eyebrow="Detalhes"
        description="Registo de entrega da planificacao trimestral do professor."
        breadcrumbs={['Planificações', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/planificacoes">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar planificacao...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && planificacao && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{planificacao.professor_info?.nome?.charAt(0) || 'P'}</div>
              <div>
                <strong>{planificacao.professor_info?.nome || 'Professor'}</strong>
                <span>{formatTrimestre(planificacao.trimestre)}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Professor" value={planificacao.professor_info?.nome} />
            <DetailItem label="Trimestre" value={formatTrimestre(planificacao.trimestre)} />
            <DetailItem label="Data de Entrega" value={formatDate(planificacao.data_entrega)} />
            <DetailItem label="Entregou" value={planificacao.entregou ? 'Sim' : 'Não'} />
            <DetailItem label="Data de Criacao" value={formatDateTime(planificacao.created_at)} />
            <DetailItem label="Ultima Atualizacao" value={formatDateTime(planificacao.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Observação</h2>
            </div>
            <p className="mb-0 text-muted">{planificacao.observacao || 'Sem observacoes registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default PlanificacaoDetailPage;
