import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createProfessor,
  deleteProfessor,
  listProfessores,
  updateProfessor,
} from '../services/professorService';

const initialForm = {
  nome: '',
  telefone: '',
  email: '',
  data_entrada: '',
  estado: 'ATIVO',
  observacao: '',
};

function getErrorMessage(error) {
  if (!error.response) {
    return 'Nao foi possivel conectar ao servidor. Verifique se o backend esta ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Professor nao encontrado.';
  }

  if (error.response.status === 409) {
    return error.response.data?.detail || 'Nao foi possivel eliminar este professor.';
  }

  if (error.response.status === 400) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
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

function buildPayload(form) {
  return {
    nome: form.nome,
    telefone: form.telefone,
    email: form.email || null,
    data_entrada: form.data_entrada || null,
    estado: form.estado,
    observacao: form.observacao,
  };
}

function ProfessorFormModal({ mode, form, onChange, onClose, onSubmit, isSubmitting }) {
  const title = mode === 'edit' ? 'Editar Professor' : 'Novo Professor';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Professores</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="nome">Nome</label>
                  <input
                    id="nome"
                    className="form-control"
                    name="nome"
                    value={form.nome}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    className="form-control"
                    name="telefone"
                    value={form.telefone}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    className="form-control"
                    name="email"
                    type="email"
                    value={form.email || ''}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="data_entrada">Data de Entrada</label>
                  <input
                    id="data_entrada"
                    className="form-control"
                    name="data_entrada"
                    type="date"
                    value={form.data_entrada || ''}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="estado">Estado</label>
                  <select
                    id="estado"
                    className="form-select"
                    name="estado"
                    value={form.estado}
                    onChange={onChange}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="observacao">Observacao</label>
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

function ProfessoresPage() {
  const [professores, setProfessores] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [ordering, setOrdering] = useState('nome');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);

  async function loadProfessores(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const data = await listProfessores({ search, estado, ordering, page: targetPage });
      setProfessores(data.results || []);
      setPagination({ count: data.count || 0, next: data.next, previous: data.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadProfessores(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, estado, ordering]);

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function openCreateModal() {
    setSelectedProfessor(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(professor) {
    setSelectedProfessor(professor);
    setForm({
      nome: professor.nome || '',
      telefone: professor.telefone || '',
      email: professor.email || '',
      data_entrada: professor.data_entrada || '',
      estado: professor.estado || 'ATIVO',
      observacao: professor.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedProfessor(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedProfessor) {
        await updateProfessor(selectedProfessor.id, buildPayload(form));
        setSuccess('Professor atualizado com sucesso.');
      } else {
        await createProfessor(buildPayload(form));
        setSuccess('Professor criado com sucesso.');
      }

      closeModal();
      await loadProfessores(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(professor) {
    const confirmed = window.confirm(`Eliminar o professor "${professor.nome}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteProfessor(professor.id);
      setSuccess('Professor eliminado com sucesso.');
      await loadProfessores(page);
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
        title="Professores"
        eyebrow="Gestao pedagogica"
        description="Cadastro e acompanhamento dos professores registados no SIGEP."
        breadcrumbs={['Professores']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Novo Professor
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de professores">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por nome, e-mail ou estado"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </div>
        <select
          className="form-select"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(event) => {
            setPage(1);
            setEstado(event.target.value);
          }}
        >
          <option value="">Todos os estados</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
        <select
          className="form-select"
          aria-label="Ordenar professores"
          value={ordering}
          onChange={(event) => {
            setPage(1);
            setOrdering(event.target.value);
          }}
        >
          <option value="nome">Nome A-Z</option>
          <option value="-nome">Nome Z-A</option>
          <option value="data_entrada">Data de entrada</option>
          <option value="-created_at">Criacao recente</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadProfessores(page)}>
          <i className="bi bi-arrow-clockwise" />
          Atualizar
        </button>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Data de Entrada</th>
                <th>Estado</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    A carregar professores...
                  </td>
                </tr>
              )}

              {!isLoading && professores.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    Nenhum professor encontrado.
                  </td>
                </tr>
              )}

              {!isLoading && professores.map((professor) => (
                <tr key={professor.id}>
                  <td>
                    <strong>{professor.nome}</strong>
                  </td>
                  <td>{professor.telefone || '-'}</td>
                  <td>{professor.email || '-'}</td>
                  <td>{formatDate(professor.data_entrada)}</td>
                  <td>
                    <span className={`sigep-badge ${professor.estado === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>
                      {professor.estado === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/professores/${professor.id}`}>
                        <i className="bi bi-eye" />
                        Ver
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(professor)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(professor)}>
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

      <nav aria-label="Paginacao de professores" className="sigep-pagination">
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
        <ProfessorFormModal
          mode={modalMode}
          form={form}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default ProfessoresPage;
