import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import { getLecionacao } from '../services/lecionacaoService';

function getErrorMessage(error) {
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  if (error.response.status === 401) return 'A sua sessão expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'Leccionação não encontrada.';
  return 'Ocorreu um erro ao carregar os dados da leccionação.';
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function DetailItem({ label, value }) {
  return <div className="detail-item"><span>{label}</span><strong>{value || '-'}</strong></div>;
}

function LecionacaoDetailPage() {
  const { id } = useParams();
  const [lecionacao, setLecionacao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadLecionacao() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getLecionacao(id);
        if (isMounted) setLecionacao(data);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLecionacao();
    return () => { isMounted = false; };
  }, [id]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Leccionação"
        breadcrumbs={['Leccionações', 'Detalhes']}
        actions={<Link className="btn btn-outline-secondary" to="/leccionacoes"><i className="bi bi-arrow-left" />Voltar</Link>}
      />

      {isLoading && <section className="empty-state"><h2>A carregar leccionação...</h2></section>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && lecionacao && (
        <>
          <section className="detail-grid">
            <DetailItem label="Professor" value={lecionacao.professor_info?.nome} />
            <DetailItem label="Disciplina" value={lecionacao.disciplina_info?.nome} />
            <DetailItem label="Classe" value={lecionacao.turma_info?.classe} />
            <DetailItem label="Sala" value={lecionacao.turma_info?.sala} />
            <DetailItem label="Turma" value={lecionacao.turma_info ? `${lecionacao.turma_info.classe} ${lecionacao.turma_info.sala}` : '-'} />
            <DetailItem label="Ano Lectivo" value={lecionacao.ano_lectivo} />
            <DetailItem label="Horário" value={lecionacao.horario} />
            <DetailItem label="Estado" value={lecionacao.estado === 'ATIVO' ? 'Ativa' : 'Inativa'} />
            <DetailItem label="Data de Criação" value={formatDateTime(lecionacao.created_at)} />
            <DetailItem label="Última Atualização" value={formatDateTime(lecionacao.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header"><h2>Observação</h2></div>
            <p className="mb-0 text-muted">{lecionacao.observacao || 'Sem observações registadas.'}</p>
          </section>
        </>
      )}
    </div>
  );
}

export default LecionacaoDetailPage;
