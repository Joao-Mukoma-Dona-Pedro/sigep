import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getPlanificacao } from '../services/planificacaoService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está activo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessão expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Planificação não encontrada.';
  }

  return 'Ocorreu um erro ao carregar os dados da planificação.';
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
    1: '1.º Trimestre',
    2: '2.º Trimestre',
    3: '3.º Trimestre',
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

  const lecionacaoInfo = planificacao?.lecionacao_info;

  return (
    <div className="page-stack">
      <PageHeader
        title="Planificação"
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
          <h2>A carregar planificação...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && planificacao && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{lecionacaoInfo?.professor?.charAt(0) || 'P'}</div>
              <div>
                <strong>{lecionacaoInfo?.professor || 'Planificação sem leccionação'}</strong>
                <span>{formatTrimestre(planificacao.trimestre)}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Professor" value={lecionacaoInfo?.professor} />
            <DetailItem label="Disciplina" value={lecionacaoInfo?.disciplina} />
            <DetailItem label="Turma" value={lecionacaoInfo?.turma} />
            <DetailItem label="Ano Lectivo" value={lecionacaoInfo?.ano_lectivo} />
            <DetailItem label="Trimestre" value={formatTrimestre(planificacao.trimestre)} />
            <DetailItem label="Data de Entrega" value={formatDate(planificacao.data_entrega)} />
            <DetailItem label="Entregou" value={planificacao.entregou ? 'Sim' : 'Não'} />
            <DetailItem label="Data de Criação" value={formatDateTime(planificacao.created_at)} />
            <DetailItem label="Última Actualização" value={formatDateTime(planificacao.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Observação</h2>
            </div>
            <p className="mb-0 text-muted">{planificacao.observacao || 'Sem observações registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default PlanificacaoDetailPage;
