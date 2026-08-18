import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getControloAula } from '../services/controloAulaService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Controlo de aula nao encontrado.';
  }

  return 'Ocorreu um erro ao carregar os dados do controlo de aula.';
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

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function ControloAulaDetailPage() {
  const { id } = useParams();
  const [controlo, setControlo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadControlo() {
      setIsLoading(true);
      setError('');

      try {
        const response = await getControloAula(id);
        if (isMounted) {
          setControlo(response);
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

    loadControlo();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Controlo de Aula"
        breadcrumbs={['Controlo de Aulas', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/controlo-aulas">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar controlo de aula...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && controlo && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{controlo.lecionacao_info?.professor?.charAt(0) || 'A'}</div>
              <div>
                <strong>{controlo.lecionacao_info?.professor || 'Professor'}</strong>
                <span>{controlo.lecionacao_info?.disciplina || 'Disciplina'}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Professor" value={controlo.lecionacao_info?.professor} />
            <DetailItem label="Disciplina" value={controlo.lecionacao_info?.disciplina} />
            <DetailItem label="Turma" value={controlo.lecionacao_info?.turma} />
            <DetailItem label="Ano Lectivo" value={controlo.lecionacao_info?.ano_lectivo} />
            <DetailItem label="Data" value={formatDate(controlo.data)} />
            <DetailItem label="Aula Assistida" value={controlo.aula_assistida ? 'Sim' : 'NÃ£o'} />
            <DetailItem label="Data de Criacao" value={formatDateTime(controlo.created_at)} />
            <DetailItem label="Ultima Atualizacao" value={formatDateTime(controlo.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>ObservaÃ§Ã£o</h2>
            </div>
            <p className="mb-0 text-muted">{controlo.observacao || 'Sem observacoes registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default ControloAulaDetailPage;
