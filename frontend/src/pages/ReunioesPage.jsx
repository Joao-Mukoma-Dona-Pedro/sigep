import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createReuniao,
  deleteReuniao,
  listReunioes,
  updateReuniao,
} from '../services/reuniaoService';

const initialForm = {
  data: '',
  assunto: '',
  participantes: '',
  decisoes: '',
  observacao: '',
};

function getErrorMessage(error) {
  if (!error.response) return 'Não foi possível conectar ao servidor. Verifique se o backend está ativo.';
  if (error.response.status === 401) return 'A sua sessão expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'Reunião não encontrada.';
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

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO').format(new Date(`${value}T00:00:00`));
}

function shortenText(value, maxLength = 90) {
  if (!value) return '-';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function buildPayload(form) {
  return {
    data: form.data,
    assunto: form.assunto,
    participantes: form.participantes,
    decisoes: form.decisoes,
    observacao: form.observacao,
  };
}

function ReuniaoFormModal({ mode, form, onChange, onClose, onSubmit, isSubmitting }) {
  const title = mode === 'edit' ? 'Editar Reunião' : 'Nova Reunião';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Reuniões</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" htmlFor="data">Data</label>
                  <input
                    id="data"
                    className="form-control"
                    type="date"
                    name="data"
                    value={form.data}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label" htmlFor="assunto">Assunto</label>
                  <input
                    id="assunto"
                    className="form-control"
                    name="assunto"
                    value={form.assunto}
                    onChange={onChange}
                    placeholder="Ex.: Acompanhamento pedagógico do trimestre"
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="participantes">Participantes</label>
                  <textarea
                    id="participantes"
                    className="form-control"
                    name="participantes"
                    rows="3"
                    value={form.participantes}
                    onChange={onChange}
                    placeholder="Ex.: Diretor Pedagógico; Coordenadores; Professores"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="decisoes">Decisões</label>
                  <textarea
                    id="decisoes"
                    className="form-control"
                    name="decisoes"
                    rows="3"
                    value={form.decisoes}
                    onChange={onChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="observacao">Observação</label>
                  <textarea
                    id="observacao"
                    className="form-control"
                    name="observacao"
                    rows="3"
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

function ReunioesPage() {
  const [reunioes, setReunioes] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [data, setData] = useState('');
  const [ordering, setOrdering] = useState('-data');
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);

  async function loadReunioes(targetPage = page) {
    setIsLoading(true);
    setError('');
    try {
      const response = await listReunioes({ search, data, ordering, page: targetPage });
      setReunioes(response.results || []);
      setPagination({ count: response.count || 0, next: response.next, previous: response.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => loadReunioes(page), 350);
    return () => window.clearTimeout(timeout);
  }, [page, search, data, ordering]);

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

  function openEditModal(reuniao) {
    setSelected(reuniao);
    setForm({
      data: reuniao.data || '',
      assunto: reuniao.assunto || '',
      participantes: reuniao.participantes || '',
      decisoes: reuniao.decisoes || '',
      observacao: reuniao.observacao || '',
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
        await updateReuniao(selected.id, buildPayload(form));
        setSuccess('Reunião atualizada com sucesso.');
      } else {
        await createReuniao(buildPayload(form));
        setSuccess('Reunião criada com sucesso.');
      }
      closeModal();
      await loadReunioes(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(reuniao) {
    const confirmed = window.confirm('Tem a certeza de que deseja eliminar esta reunião?');
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      await deleteReuniao(reuniao.id);
      setSuccess('Reunião eliminada com sucesso.');
      await loadReunioes(page);
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
        title="Reuniões"
        eyebrow="Gestão Pedagógica"
        description="Registo administrativo das reuniões realizadas no âmbito da gestão pedagógica."
        breadcrumbs={['Reuniões']}
        actions={<button className="btn btn-primary" type="button" onClick={openCreateModal}><i className="bi bi-plus-lg" />Nova Reunião</button>}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de reuniões">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por assunto ou participantes"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <input
          className="form-control"
          type="date"
          aria-label="Filtrar por data"
          value={data}
          onChange={(event) => resetAndSetPage(event, setData)}
        />
        <select className="form-select" value={ordering} onChange={(event) => resetAndSetPage(event, setOrdering)}>
          <option value="-data">Mais recentes</option>
          <option value="data">Mais antigas</option>
          <option value="assunto">Assunto</option>
        </select>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Data</th>
                <th>Assunto</th>
                <th>Participantes</th>
                <th>Decisões</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan="5" className="text-center text-muted py-4">A carregar reuniões...</td></tr>}
              {!isLoading && reunioes.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-4">Nenhuma reunião encontrada.</td></tr>}
              {!isLoading && reunioes.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.data)}</td>
                  <td><strong>{item.assunto}</strong></td>
                  <td className="text-muted">{shortenText(item.participantes)}</td>
                  <td className="text-muted">{shortenText(item.decisoes)}</td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/reunioes/${item.id}`}><i className="bi bi-eye" />Ver</Link>
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

      <nav aria-label="Paginação de reuniões" className="sigep-pagination">
        <span>{pagination.count} registo{pagination.count === 1 ? '' : 's'} encontrado{pagination.count === 1 ? '' : 's'}</span>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}><button className="page-link" type="button" onClick={() => changePage(page - 1)}>Anterior</button></li>
          <li className="page-item active"><button className="page-link" type="button">{page} / {totalPages}</button></li>
          <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}><button className="page-link" type="button" onClick={() => changePage(page + 1)}>Seguinte</button></li>
        </ul>
      </nav>

      {modalMode && (
        <ReuniaoFormModal
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

export default ReunioesPage;
