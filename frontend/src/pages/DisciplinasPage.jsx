import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createDisciplina,
  deleteDisciplina,
  listDisciplinas,
  updateDisciplina,
} from '../services/disciplinaService';

const initialForm = {
  nome: '',
  codigo: '',
  estado: 'ATIVO',
  observacao: '',
};

function getErrorMessage(error) {
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  if (error.response.status === 401) return 'A sua sessão expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'Disciplina não encontrada.';
  if (error.response.status === 409) return error.response.data?.detail || 'Não foi possível eliminar esta disciplina.';
  if (error.response.status === 400) {
    const data = error.response.data;
    if (data?.detail) return data.detail;
    if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
    const firstField = Object.keys(data || {})[0];
    const firstMessage = firstField ? data[firstField]?.[0] : null;
    return firstMessage || 'Verifique os dados do formulário.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

function buildPayload(form) {
  return {
    nome: form.nome,
    codigo: form.codigo,
    estado: form.estado,
    observacao: form.observacao,
  };
}

function DisciplinaFormModal({ mode, form, onChange, onClose, onSubmit, isSubmitting }) {
  const title = mode === 'edit' ? 'Editar Disciplina' : 'Adicionar Disciplina';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Disciplinas</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="nome">Nome da Disciplina</label>
                  <input
                    id="nome"
                    className="form-control"
                    name="nome"
                    value={form.nome}
                    onChange={onChange}
                    placeholder="Ex.: Matemática"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="codigo">Código</label>
                  <input
                    id="codigo"
                    className="form-control"
                    name="codigo"
                    value={form.codigo}
                    onChange={onChange}
                    placeholder="Ex.: MAT"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="estado">Estado</label>
                  <select id="estado" className="form-select" name="estado" value={form.estado} onChange={onChange}>
                    <option value="ATIVO">Ativa</option>
                    <option value="INATIVO">Inativa</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="observacao">Observação</label>
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
              <button className="btn btn-outline-secondary" type="button" onClick={onClose}>Cancelar</button>
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

function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [ordering, setOrdering] = useState('nome');
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);

  async function loadDisciplinas(targetPage = page) {
    setIsLoading(true);
    setError('');
    try {
      const response = await listDisciplinas({ search, estado, ordering, page: targetPage });
      setDisciplinas(response.results || []);
      setPagination({ count: response.count || 0, next: response.next, previous: response.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => loadDisciplinas(page), 350);
    return () => window.clearTimeout(timeout);
  }, [page, search, estado, ordering]);

  function resetAndSetPage(event, setter) {
    setPage(1);
    setter(event.target.value);
  }

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function openCreateModal() {
    setSelected(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(disciplina) {
    setSelected(disciplina);
    setForm({
      nome: disciplina.nome || '',
      codigo: disciplina.codigo || '',
      estado: disciplina.estado || 'ATIVO',
      observacao: disciplina.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelected(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      if (modalMode === 'edit' && selected) {
        await updateDisciplina(selected.id, buildPayload(form));
        setSuccess('Disciplina atualizada com sucesso.');
      } else {
        await createDisciplina(buildPayload(form));
        setSuccess('Disciplina criada com sucesso.');
      }
      closeModal();
      await loadDisciplinas(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(disciplina) {
    const confirmed = window.confirm(`Eliminar a disciplina "${disciplina.nome}"?`);
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      await deleteDisciplina(disciplina.id);
      setSuccess('Disciplina eliminada com sucesso.');
      await loadDisciplinas(page);
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
        title="Disciplinas"
        breadcrumbs={['Disciplinas']}
        actions={<button className="btn btn-primary" type="button" onClick={openCreateModal}><i className="bi bi-plus-lg" />Adicionar Disciplina</button>}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de disciplinas">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar disciplinas"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select className="form-select" value={estado} onChange={(event) => resetAndSetPage(event, setEstado)}>
          <option value="">Todos os estados</option>
          <option value="ATIVO">Ativas</option>
          <option value="INATIVO">Inativas</option>
        </select>
        <select className="form-select" value={ordering} onChange={(event) => resetAndSetPage(event, setOrdering)}>
          <option value="nome">Nome</option>
          <option value="codigo">Código</option>
          <option value="-created_at">Mais recentes</option>
        </select>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Nome da Disciplina</th>
                <th>Código</th>
                <th>Estado</th>
                <th>Observação</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan="5" className="text-center text-muted py-4">A carregar disciplinas...</td></tr>}
              {!isLoading && disciplinas.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">Nenhuma disciplina encontrada.</td></tr>}
              {!isLoading && disciplinas.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nome}</strong></td>
                  <td>{item.codigo || '-'}</td>
                  <td><span className={`sigep-badge ${item.estado === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>{item.estado === 'ATIVO' ? 'Ativa' : 'Inativa'}</span></td>
                  <td className="text-muted">{item.observacao || '-'}</td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/disciplinas/${item.id}`}><i className="bi bi-eye" />Ver</Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(item)}><i className="bi bi-pencil" />Editar</button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(item)}><i className="bi bi-trash" />Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <nav aria-label="Paginação de disciplinas" className="sigep-pagination">
        <span>{pagination.count} registo{pagination.count === 1 ? '' : 's'} encontrado{pagination.count === 1 ? '' : 's'}</span>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}><button className="page-link" type="button" onClick={() => changePage(page - 1)}>Anterior</button></li>
          <li className="page-item active"><button className="page-link" type="button">{page} / {totalPages}</button></li>
          <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}><button className="page-link" type="button" onClick={() => changePage(page + 1)}>Seguinte</button></li>
        </ul>
      </nav>

      {modalMode && (
        <DisciplinaFormModal
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

export default DisciplinasPage;
