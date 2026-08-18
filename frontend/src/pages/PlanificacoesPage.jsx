import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createPlanificacao,
  deletePlanificacao,
  listPlanificacoes,
  listProfessorOptions,
  updatePlanificacao,
} from '../services/planificacaoService';

const initialForm = {
  professor: '',
  trimestre: '1',
  data_entrega: '',
  entregou: false,
  observacao: '',
};

function getErrorMessage(error) {
  if (!error.response) {
    return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Planificacao nao encontrada.';
  }

  if (error.response.status === 400) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
    const firstField = Object.keys(data || {})[0];
    const firstMessage = firstField ? data[firstField]?.[0] : null;
    return firstMessage || 'Verifique os dados do formulario.';
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO').format(new Date(value));
}

function formatTrimestre(value) {
  const labels = {
    1: '1o Trimestre',
    2: '2o Trimestre',
    3: '3o Trimestre',
  };
  return labels[value] || '-';
}

function buildPayload(form) {
  return {
    professor: form.professor ? Number(form.professor) : '',
    trimestre: form.trimestre,
    data_entrega: form.data_entrega || null,
    entregou: Boolean(form.entregou),
    observacao: form.observacao,
  };
}

function PlanificacaoFormModal({
  mode,
  form,
  professores,
  onChange,
  onCheckChange,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const title = mode === 'edit' ? 'Editar Planificacao' : 'Nova Planificacao';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">PlanificaÃ§Ãµes</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="professor">Professor</label>
                  <select
                    id="professor"
                    className="form-select"
                    name="professor"
                    value={form.professor}
                    onChange={onChange}
                    required
                  >
                    <option value="">Selecione um professor</option>
                    {professores.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="trimestre">Trimestre</label>
                  <select
                    id="trimestre"
                    className="form-select"
                    name="trimestre"
                    value={form.trimestre}
                    onChange={onChange}
                    required
                  >
                    <option value="1">1o Trimestre</option>
                    <option value="2">2o Trimestre</option>
                    <option value="3">3o Trimestre</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="data_entrega">Data de Entrega</label>
                  <input
                    id="data_entrega"
                    className="form-control"
                    name="data_entrega"
                    type="date"
                    value={form.data_entrega || ''}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <div className="form-check form-switch mb-2">
                    <input
                      id="entregou"
                      className="form-check-input"
                      name="entregou"
                      type="checkbox"
                      checked={form.entregou}
                      onChange={onCheckChange}
                    />
                    <label className="form-check-label" htmlFor="entregou">
                      Entregou
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="observacao">ObservaÃ§Ã£o</label>
                  <textarea
                    id="observacao"
                    className="form-control"
                    name="observacao"
                    rows="4"
                    value={form.observacao}
                    onChange={onChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                <i className="bi bi-check2-circle" />
                {isSubmitting ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function PlanificacoesPage() {
  const [planificacoes, setPlanificacoes] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [professor, setProfessor] = useState('');
  const [trimestre, setTrimestre] = useState('');
  const [entregou, setEntregou] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordering, setOrdering] = useState('-data_entrega');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedPlanificacao, setSelectedPlanificacao] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);

  async function loadPlanificacoes(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const data = await listPlanificacoes({
        search,
        professor,
        trimestre,
        entregou,
        data_inicio: dataInicio,
        data_fim: dataFim,
        ordering,
        page: targetPage,
      });
      setPlanificacoes(data.results || []);
      setPagination({ count: data.count || 0, next: data.next, previous: data.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProfessores() {
    try {
      const data = await listProfessorOptions();
      setProfessores(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  useEffect(() => {
    loadProfessores();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadPlanificacoes(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, professor, trimestre, entregou, dataInicio, dataFim, ordering]);

  function resetAndSetPage(event, setter) {
    setPage(1);
    setter(event.target.value);
  }

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleCheckChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.checked }));
  }

  function openCreateModal() {
    setSelectedPlanificacao(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(planificacao) {
    setSelectedPlanificacao(planificacao);
    setForm({
      professor: planificacao.professor || '',
      trimestre: planificacao.trimestre || '1',
      data_entrega: planificacao.data_entrega || '',
      entregou: Boolean(planificacao.entregou),
      observacao: planificacao.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedPlanificacao(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedPlanificacao) {
        await updatePlanificacao(selectedPlanificacao.id, buildPayload(form));
        setSuccess('Planificacao atualizada com sucesso.');
      } else {
        await createPlanificacao(buildPayload(form));
        setSuccess('Planificacao criada com sucesso.');
      }

      closeModal();
      await loadPlanificacoes(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(planificacao) {
    const professorNome = planificacao.professor_info?.nome || 'professor selecionado';
    const confirmed = window.confirm(`Eliminar a planificacao de "${professorNome}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deletePlanificacao(planificacao.id);
      setSuccess('Planificacao eliminada com sucesso.');
      await loadPlanificacoes(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="PlanificaÃ§Ãµes"
        breadcrumbs={['PlanificaÃ§Ãµes']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Nova Planificacao
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de planificacoes">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por professor, e-mail ou observacao"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select
          className="form-select"
          aria-label="Filtrar por professor"
          value={professor}
          onChange={(event) => resetAndSetPage(event, setProfessor)}
        >
          <option value="">Todos os professores</option>
          {professores.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          aria-label="Filtrar por trimestre"
          value={trimestre}
          onChange={(event) => resetAndSetPage(event, setTrimestre)}
        >
          <option value="">Todos os trimestres</option>
          <option value="1">1o Trimestre</option>
          <option value="2">2o Trimestre</option>
          <option value="3">3o Trimestre</option>
        </select>
        <select
          className="form-select"
          aria-label="Filtrar por entrega"
          value={entregou}
          onChange={(event) => resetAndSetPage(event, setEntregou)}
        >
          <option value="">Todas</option>
          <option value="true">Entregues</option>
          <option value="false">Pendentes</option>
        </select>
        <input
          className="form-control"
          aria-label="Data inicial"
          type="date"
          value={dataInicio}
          onChange={(event) => resetAndSetPage(event, setDataInicio)}
        />
        <input
          className="form-control"
          aria-label="Data final"
          type="date"
          value={dataFim}
          onChange={(event) => resetAndSetPage(event, setDataFim)}
        />
        <select
          className="form-select"
          aria-label="Ordenar planificacoes"
          value={ordering}
          onChange={(event) => resetAndSetPage(event, setOrdering)}
        >
          <option value="-data_entrega">Entrega recente</option>
          <option value="data_entrega">Entrega antiga</option>
          <option value="trimestre">Trimestre</option>
          <option value="-created_at">Criacao recente</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadPlanificacoes(page)}>
          <i className="bi bi-arrow-clockwise" />
          Atualizar
        </button>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Professor</th>
                <th>Trimestre</th>
                <th>Data de Entrega</th>
                <th>Entregou</th>
                <th>ObservaÃ§Ã£o</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    A carregar planificacoes...
                  </td>
                </tr>
              )}

              {!isLoading && planificacoes.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    Nenhuma planificacao encontrada.
                  </td>
                </tr>
              )}

              {!isLoading && planificacoes.map((planificacao) => (
                <tr key={planificacao.id}>
                  <td>
                    <strong>{planificacao.professor_info?.nome || '-'}</strong>
                  </td>
                  <td>{formatTrimestre(planificacao.trimestre)}</td>
                  <td>{formatDate(planificacao.data_entrega)}</td>
                  <td>
                    <span className={`sigep-badge ${planificacao.entregou ? 'badge-success' : 'badge-warning'}`}>
                      {planificacao.entregou ? 'Sim' : 'NÃ£o'}
                    </span>
                  </td>
                  <td>{planificacao.observacao || '-'}</td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/planificacoes/${planificacao.id}`}>
                        <i className="bi bi-eye" />
                        Ver
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(planificacao)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(planificacao)}>
                        <i className="bi bi-trash" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav aria-label="Paginacao de planificacoes" className="sigep-pagination">
        <span>
          {pagination.count} registo{pagination.count === 1 ? '' : 's'} encontrado{pagination.count === 1 ? '' : 's'}
        </span>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}>
            <button className="page-link" type="button" onClick={() => changePage(page - 1)}>
              Anterior
            </button>
          </li>
          <li className="page-item active">
            <button className="page-link" type="button">
              {page} / {totalPages}
            </button>
          </li>
          <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}>
            <button className="page-link" type="button" onClick={() => changePage(page + 1)}>
              Seguinte
            </button>
          </li>
        </ul>
      </nav>

      {modalMode && (
        <PlanificacaoFormModal
          mode={modalMode}
          form={form}
          professores={professores}
          onChange={handleFormChange}
          onCheckChange={handleCheckChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default PlanificacoesPage;
