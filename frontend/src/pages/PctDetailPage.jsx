import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getPCT } from '../services/pctService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'Nao foi possivel conectar ao servidor. Verifique se o backend esta ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'PCT nao encontrada.';
  }

  return 'Ocorreu um erro ao carregar os dados da PCT.';
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

function PctDetailPage() {
  const { id } = useParams();
  const [pct, setPct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadPct() {
      setIsLoading(true);
      setError('');

      try {
        const response = await getPCT(id);
        if (isMounted) {
          setPct(response);
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

    loadPct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title="PCT"
        eyebrow="Detalhes"
        description="Registo da Prova Comum Trimestral por lecionacao."
        breadcrumbs={['PCT', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/pct">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar PCT...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && pct && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{pct.lecionacao_info?.professor?.charAt(0) || 'P'}</div>
              <div>
                <strong>{pct.lecionacao_info?.professor || 'Professor'}</strong>
                <span>{formatTrimestre(pct.trimestre)}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Professor" value={pct.lecionacao_info?.professor} />
            <DetailItem label="Disciplina" value={pct.lecionacao_info?.disciplina} />
            <DetailItem label="Turma" value={pct.lecionacao_info?.turma} />
            <DetailItem label="Ano Lectivo" value={pct.lecionacao_info?.ano_lectivo} />
            <DetailItem label="Trimestre" value={formatTrimestre(pct.trimestre)} />
            <DetailItem label="Data de Aplicacao" value={formatDate(pct.data_aplicacao)} />
            <DetailItem label="Nota Lancada" value={pct.nota_lancada ? 'Sim' : 'Nao'} />
            <DetailItem label="Data de Criacao" value={formatDateTime(pct.created_at)} />
            <DetailItem label="Ultima Atualizacao" value={formatDateTime(pct.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Observacao</h2>
            </div>
            <p className="mb-0 text-muted">{pct.observacao || 'Sem observacoes registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default PctDetailPage;
