import { useEffect, useMemo, useState } from 'react';

import PageHeader from '../components/ui/PageHeader';
import {
  createTipoOcorrencia,
  deleteTipoOcorrencia,
  listTiposOcorrencia,
  updateTipoOcorrencia,
} from '../services/tipoOcorrenciaService';

const categorias = [
  { value: 'DISCIPLINAR', label: 'Disciplinar' },
  { value: 'COMPORTAMENTAL', label: 'Comportamental' },
  { value: 'ACADEMICA', label: 'Académica' },
  { value: 'OUTROS', label: 'Outros' },
];

const initialForm = {
  descricao: '',
  categoria: 'DISCIPLINAR',
};

function getCategoriaLabel(value) {
  return categorias.find((categoria) => categoria.value === value)?.label || value || '-';
}

function getErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Tipo de ocorrencia nao encontrado.';
  }

  if (error.response.status === 409) {
    return error.response.data?.detail || 'Não foi possível eliminar este tipo de ocorrência.';
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

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function TipoOcorrenciaFormModal({ mode, form, onChange, onClose, onSubmit, isSubmitting }) {
  const title = mode === 'edit' ? 'Editar Tipo de Ocorrencia' : 'Novo Tipo de Ocorrencia';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Tipos de Ocorrências</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label" htmlFor="descricao">Descricao</label>
                  <input
                    id="descricao"
                    className="form-control"
                    name="descricao"
                    value={form.descricao}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="categoria">Categoria</label>
                  <select
                    id="categoria"
                    className="form-select"
                    name="categoria"
                    value={form.categoria}
                    onChange={onChange}
                    required
                  >
                    {categorias.map((categoria) => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
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

function TipoOcorrenciaDetailModal({ tipo, onClose }) {
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content sigep-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Detalhes</p>
                <h2 className="modal-title h5">{tipo.descricao}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <section className="detail-grid">
                <div className="detail-item">
                  <span>Descricao</span>
                  <strong>{tipo.descricao}</strong>
                </div>
                <div className="detail-item">
                  <span>Categoria</span>
                  <strong>{getCategoriaLabel(tipo.categoria)}</strong>
                </div>
                <div className="detail-item">
                  <span>Data de Criacao</span>
                  <strong>{formatDateTime(tipo.created_at)}</strong>
                </div>
                <div className="detail-item">
                  <span>Ultima Atualizacao</span>
                  <strong>{formatDateTime(tipo.updated_at)}</strong>
                </div>
              </section>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function TiposOcorrenciaPage() {
  const [tipos, setTipos] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [ordering, setOrdering] = useState('categoria');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);

  async function loadTipos(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const response = await listTiposOcorrencia({ search, categoria, ordering, page: targetPage });
      setTipos(response.results || []);
      setPagination({ count: response.count || 0, next: response.next, previous: response.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadTipos(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, categoria, ordering]);

  function resetAndSetPage(event, setter) {
    setPage(1);
    setter(event.target.value);
  }

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function openCreateModal() {
    setSelectedTipo(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(tipo) {
    setSelectedTipo(tipo);
    setForm({
      descricao: tipo.descricao || '',
      categoria: tipo.categoria || 'DISCIPLINAR',
    });
    setModalMode('edit');
  }

  function openDetailModal(tipo) {
    setSelectedTipo(tipo);
    setModalMode('detail');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedTipo(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedTipo) {
        await updateTipoOcorrencia(selectedTipo.id, form);
        setSuccess('Tipo de ocorrencia atualizado com sucesso.');
      } else {
        await createTipoOcorrencia(form);
        setSuccess('Tipo de ocorrencia criado com sucesso.');
      }

      closeModal();
      await loadTipos(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(tipo) {
    const confirmed = window.confirm(`Eliminar o tipo de ocorrencia "${tipo.descricao}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteTipoOcorrencia(tipo.id);
      setSuccess('Tipo de ocorrencia eliminado com sucesso.');
      await loadTipos(page);
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
        title="Tipos de Ocorrências"
        eyebrow="Classificacao"
        description="Cadastro auxiliar para classificar ocorrencias dos alunos."
        breadcrumbs={['Tipos de Ocorrências']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Novo Tipo
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de tipos de ocorrencia">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por descricao"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select className="form-select" value={categoria} onChange={(event) => resetAndSetPage(event, setCategoria)}>
          <option value="">Todas as categorias</option>
          {categorias.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select className="form-select" value={ordering} onChange={(event) => resetAndSetPage(event, setOrdering)}>
          <option value="categoria">Categoria</option>
          <option value="descricao">Descricao</option>
          <option value="-created_at">Criacao recente</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadTipos(page)}>
          <i className="bi bi-arrow-clockwise" />
          Atualizar
        </button>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Descricao</th>
                <th>Categoria</th>
                <th>Data de Criacao</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">A carregar tipos de ocorrencia...</td>
                </tr>
              )}

              {!isLoading && tipos.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">Nenhum tipo de ocorrencia encontrado.</td>
                </tr>
              )}

              {!isLoading && tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td><strong>{tipo.descricao}</strong></td>
                  <td>
                    <span className="sigep-badge badge-info">{getCategoriaLabel(tipo.categoria)}</span>
                  </td>
                  <td>{formatDateTime(tipo.created_at)}</td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openDetailModal(tipo)}>
                        <i className="bi bi-eye" />
                        Ver
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(tipo)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(tipo)}>
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

      <nav aria-label="Paginacao de tipos de ocorrencia" className="sigep-pagination">
        <span>{pagination.count} registo{pagination.count === 1 ? '' : 's'} encontrado{pagination.count === 1 ? '' : 's'}</span>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}>
            <button className="page-link" type="button" onClick={() => changePage(page - 1)}>Anterior</button>
          </li>
          <li className="page-item active">
            <button className="page-link" type="button">{page} / {totalPages}</button>
          </li>
          <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}>
            <button className="page-link" type="button" onClick={() => changePage(page + 1)}>Seguinte</button>
          </li>
        </ul>
      </nav>

      {(modalMode === 'create' || modalMode === 'edit') && (
        <TipoOcorrenciaFormModal
          mode={modalMode}
          form={form}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}

      {modalMode === 'detail' && selectedTipo && (
        <TipoOcorrenciaDetailModal tipo={selectedTipo} onClose={closeModal} />
      )}
    </div>
  );
}

export default TiposOcorrenciaPage;
