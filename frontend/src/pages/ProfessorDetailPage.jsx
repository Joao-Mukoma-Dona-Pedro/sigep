import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getProfessor } from '../services/professorService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Professor nao encontrado.';
  }

  return 'Ocorreu um erro ao carregar os dados do professor.';
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

function ProfessorDetailPage() {
  const { id } = useParams();
  const [professor, setProfessor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfessor() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getProfessor(id);
        if (isMounted) {
          setProfessor(data);
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

    loadProfessor();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title={professor?.nome || 'Professor'}
        breadcrumbs={['Professores', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/professores">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar professor...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && professor && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{professor.nome.charAt(0)}</div>
              <div>
                <strong>{professor.nome}</strong>
                <span>{professor.email || 'Sem e-mail registado'}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Nome" value={professor.nome} />
            <DetailItem label="Telefone" value={professor.telefone} />
            <DetailItem label="E-mail" value={professor.email} />
            <DetailItem label="Data de Entrada" value={formatDate(professor.data_entrada)} />
            <DetailItem label="Estado" value={professor.estado === 'ATIVO' ? 'Ativo' : 'Inativo'} />
            <DetailItem label="Data de Criacao" value={formatDateTime(professor.created_at)} />
            <DetailItem label="Ultima Atualizacao" value={formatDateTime(professor.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Observação</h2>
            </div>
            <p className="mb-0 text-muted">{professor.observacao || 'Sem observacoes registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default ProfessorDetailPage;
