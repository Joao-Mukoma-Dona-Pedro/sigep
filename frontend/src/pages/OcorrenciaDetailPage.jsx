import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getOcorrencia } from '../services/ocorrenciaService';

const categorias = {
  DISCIPLINAR: 'Disciplinar',
  COMPORTAMENTAL: 'Comportamental',
  ACADEMICA: 'Académica',
  OUTROS: 'Outros',
};

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Ocorrencia nao encontrada.';
  }

  return 'Ocorreu um erro ao carregar os dados da ocorrencia.';
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

function getCategoriaLabel(value) {
  return categorias[value] || value || '-';
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
      <p className="mb-0 text-muted">{text || 'Sem registo.'}</p>
    </section>
  );
}

function OcorrenciaDetailPage() {
  const { id } = useParams();
  const [ocorrencia, setOcorrencia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOcorrencia() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getOcorrencia(id);
        if (isMounted) {
          setOcorrencia(data);
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

    loadOcorrencia();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title={ocorrencia?.aluno_info?.nome || 'Ocorrencia'}
        eyebrow="Detalhes"
        description="Informacoes da ocorrencia registada para o aluno."
        breadcrumbs={['Ocorrências', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/ocorrencias">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar ocorrencia...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && ocorrencia && (
        <>
          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Aluno</h2>
            </div>
            <div className="detail-grid">
              <DetailItem label="Nome" value={ocorrencia.aluno_info?.nome} />
              <DetailItem label="Turma" value={ocorrencia.aluno_info?.turma} />
              <DetailItem label="Classe" value={ocorrencia.aluno_info?.classe} />
              <DetailItem label="Numero" value={ocorrencia.aluno_info?.numero ?? '-'} />
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Ocorrencia</h2>
            </div>
            <div className="detail-grid">
              <DetailItem label="Tipo" value={ocorrencia.tipo_info?.descricao} />
              <DetailItem label="Categoria" value={getCategoriaLabel(ocorrencia.tipo_info?.categoria)} />
              <DetailItem label="Data da Ocorrencia" value={formatDate(ocorrencia.data_ocorrencia)} />
            </div>
          </section>

          <TextPanel title="Descricao" text={ocorrencia.descricao} />
          <TextPanel title="Medida Tomada" text={ocorrencia.medida_tomada} />
          <TextPanel title="Observação" text={ocorrencia.observacao} />

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>Registo</h2>
            </div>
            <div className="detail-grid">
              <DetailItem label="Registada por" value={ocorrencia.registada_por_info?.nome} />
              <DetailItem label="Data de Criacao" value={formatDateTime(ocorrencia.created_at)} />
              <DetailItem label="Ultima Atualizacao" value={formatDateTime(ocorrencia.updated_at)} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default OcorrenciaDetailPage;
