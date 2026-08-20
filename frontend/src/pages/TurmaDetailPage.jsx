import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getTurma } from '../services/turmaService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Turma nao encontrada.';
  }

  return 'Ocorreu um erro ao carregar os dados da turma.';
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatPeriodo(value) {
  const labels = {
    MANHA: 'Manha',
    TARDE: 'Tarde',
    NOITE: 'Noite',
  };
  return labels[value] || value || '-';
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function TurmaDetailPage() {
  const { id } = useParams();
  const [turma, setTurma] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadTurma() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getTurma(id);
        if (isMounted) {
          setTurma(data);
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

    loadTurma();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title={turma ? `${turma.classe} ${turma.sala}` : 'Turma'}
        breadcrumbs={['Turmas', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/turmas">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar turma...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && turma && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{turma.classe.charAt(0)}</div>
              <div>
                <strong>{turma.classe} {turma.sala}</strong>
                <span>{turma.diretor_turma_info?.nome || 'Sem diretor de turma definido'}</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Classe" value={turma.classe} />
            <DetailItem label="Sala" value={turma.sala} />
            <DetailItem label="Periodo" value={formatPeriodo(turma.periodo)} />
            <DetailItem label="Turno" value={turma.turno} />
            <DetailItem label="Ano Lectivo" value={turma.ano_lectivo} />
            <DetailItem label="Diretor de Turma" value={turma.diretor_turma_info?.nome} />
            <DetailItem label="Capacidade" value={turma.capacidade} />
            <DetailItem label="Estado" value={turma.estado === 'ATIVO' ? 'Ativa' : 'Inativa'} />
            <DetailItem label="Data de Criacao" value={formatDateTime(turma.created_at)} />
            <DetailItem label="Ultima Atualizacao" value={formatDateTime(turma.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Observação</h2>
            </div>
            <p className="mb-0 text-muted">{turma.observacao || 'Sem observacoes registadas.'}</p>
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Alunos da Turma</h2>
              <span className="sigep-badge badge-info">Preparado</span>
            </div>
            <p className="mb-0 text-muted">
              Esta area fica reservada para apresentar os alunos quando o modulo Alunos for implementado.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

export default TurmaDetailPage;
