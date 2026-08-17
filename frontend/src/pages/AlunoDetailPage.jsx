import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getAluno } from '../services/alunoService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Aluno nao encontrado.';
  }

  return 'Ocorreu um erro ao carregar os dados do aluno.';
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

function formatSexo(value) {
  const labels = {
    M: 'Masculino',
    F: 'Feminino',
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

function AlunoDetailPage() {
  const { id } = useParams();
  const [aluno, setAluno] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAluno() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getAluno(id);
        if (isMounted) {
          setAluno(data);
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

    loadAluno();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title={aluno?.nome || 'Aluno'}
        eyebrow="Detalhes"
        description="Informacoes pedagogicas e administrativas do aluno."
        breadcrumbs={['Alunos', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/alunos">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar aluno...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && aluno && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{aluno.nome.charAt(0)}</div>
              <div>
                <strong>{aluno.nome}</strong>
                <span>
                  {aluno.turma_info
                    ? `${aluno.turma_info.classe} ${aluno.turma_info.sala}`
                    : 'Sem turma definida'}
                </span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Numero" value={aluno.numero ?? '-'} />
            <DetailItem label="Nome" value={aluno.nome} />
            <DetailItem label="Classe" value={aluno.turma_info?.classe} />
            <DetailItem label="Turma" value={aluno.turma_info ? `${aluno.turma_info.classe} ${aluno.turma_info.sala}` : '-'} />
            <DetailItem label="Sala" value={aluno.turma_info?.sala} />
            <DetailItem label="Data de Nascimento" value={formatDate(aluno.data_nascimento)} />
            <DetailItem label="Sexo" value={formatSexo(aluno.sexo)} />
            <DetailItem label="Encarregado de Educacao" value={aluno.encarregado_educacao} />
            <DetailItem label="Telefone" value={aluno.telefone_encarregado} />
            <DetailItem label="Estado" value={aluno.estado === 'ATIVO' ? 'Ativo' : 'Inativo'} />
            <DetailItem label="Data de Criacao" value={formatDateTime(aluno.created_at)} />
            <DetailItem label="Ultima Atualizacao" value={formatDateTime(aluno.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Observação</h2>
            </div>
            <p className="mb-0 text-muted">{aluno.observacao || 'Sem observacoes registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default AlunoDetailPage;
