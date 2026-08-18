import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getDisciplina } from '../services/disciplinaService';

function getErrorMessage(error) {
  if (!error.response) return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  if (error.response.status === 401) return 'A sua sessÃ£o expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'Disciplina nÃ£o encontrada.';
  return 'Ocorreu um erro ao carregar os dados da disciplina.';
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

function DisciplinaDetailPage() {
  const { id } = useParams();
  const [disciplina, setDisciplina] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDisciplina() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getDisciplina(id);
        if (isMounted) setDisciplina(data);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDisciplina();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title={disciplina?.nome || 'Disciplina'}
        breadcrumbs={['Disciplinas', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/disciplinas">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar disciplina...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && disciplina && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{disciplina.nome.charAt(0)}</div>
              <div>
                <strong>{disciplina.nome}</strong>
                <span>{disciplina.codigo || 'Sem cÃ³digo registado'}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Nome da Disciplina" value={disciplina.nome} />
            <DetailItem label="CÃ³digo" value={disciplina.codigo} />
            <DetailItem label="Estado" value={disciplina.estado === 'ATIVO' ? 'Ativa' : 'Inativa'} />
            <DetailItem label="Data de CriaÃ§Ã£o" value={formatDateTime(disciplina.created_at)} />
            <DetailItem label="Ãšltima AtualizaÃ§Ã£o" value={formatDateTime(disciplina.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>ObservaÃ§Ã£o</h2>
            </div>
            <p className="mb-0 text-muted">{disciplina.observacao || 'Sem observaÃ§Ãµes registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default DisciplinaDetailPage;
