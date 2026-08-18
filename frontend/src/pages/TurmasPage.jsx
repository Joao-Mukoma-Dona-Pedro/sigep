import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createTurma,
  deleteTurma,
  listProfessorOptions,
  listTurmas,
  updateTurma,
} from '../services/turmaService';

const initialForm = {
  classe: '',
  sala: '',
  periodo: 'MANHA',
  ano_lectivo: '',
  turno: '',
  capacidade: '',
  diretor_turma: '',
  estado: 'ATIVO',
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
    return 'Turma nao encontrada.';
  }

  if (error.response.status === 409) {
    return error.response.data?.detail || 'NÃ£o foi possÃ­vel eliminar esta turma.';
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

function formatPeriodo(value) {
  const labels = {
    MANHA: 'Manha',
    TARDE: 'Tarde',
    NOITE: 'Noite',
  };
  return labels[value] || value || '-';
}

function buildPayload(form) {
  return {
    classe: form.classe,
    sala: form.sala,
    periodo: form.periodo,
    ano_lectivo: form.ano_lectivo,
    turno: form.turno,
    capacidade: form.capacidade ? Number(form.capacidade) : null,
    diretor_turma: form.diretor_turma ? Number(form.diretor_turma) : null,
    estado: form.estado,
    observacao: form.observacao,
  };
}

function TurmaFormModal({
  mode,
  form,
  professores,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const title = mode === 'edit' ? 'Editar Turma' : 'Nova Turma';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Turmas</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="classe">Classe</label>
                  <input
                    id="classe"
                    className="form-control"
                    name="classe"
                    value={form.classe}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="sala">Sala</label>
                  <input
                    id="sala"
                    className="form-control"
                    name="sala"
                    value={form.sala}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="periodo">Periodo</label>
                  <select
                    id="periodo"
                    className="form-select"
                    name="periodo"
                    value={form.periodo}
                    onChange={onChange}
                    required
                  >
                    <option value="MANHA">Manha</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="ano_lectivo">Ano Lectivo</label>
                  <input
                    id="ano_lectivo"
                    className="form-control"
                    name="ano_lectivo"
                    placeholder="2026 ou 2026/2027"
                    value={form.ano_lectivo}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="turno">Turno</label>
                  <input
                    id="turno"
                    className="form-control"
                    name="turno"
                    value={form.turno}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="capacidade">Capacidade</label>
                  <input
                    id="capacidade"
                    className="form-control"
                    min="1"
                    name="capacidade"
                    type="number"
                    value={form.capacidade}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="diretor_turma">Diretor de Turma</label>
                  <select
                    id="diretor_turma"
                    className="form-select"
                    name="diretor_turma"
                    value={form.diretor_turma}
                    onChange={onChange}
                  >
                    <option value="">Sem diretor definido</option>
                    {professores.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.nome}
                      </option>
                    ))}
                  </select>
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

function TurmasPage() {
  const [turmas, setTurmas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [anoLectivo, setAnoLectivo] = useState('');
  const [ordering, setOrdering] = useState('ano_lectivo');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);

  async function loadTurmas(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const data = await listTurmas({
        search,
        estado,
        periodo,
        ano_lectivo: anoLectivo,
        ordering,
        page: targetPage,
      });
      setTurmas(data.results || []);
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
      loadTurmas(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, estado, periodo, anoLectivo, ordering]);

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetAndSetPage(event, setter) {
    setPage(1);
    setter(event.target.value);
  }

  function openCreateModal() {
    setSelectedTurma(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(turma) {
    setSelectedTurma(turma);
    setForm({
      classe: turma.classe || '',
      sala: turma.sala || '',
      periodo: turma.periodo || 'MANHA',
      ano_lectivo: turma.ano_lectivo || '',
      turno: turma.turno || '',
      capacidade: turma.capacidade || '',
      diretor_turma: turma.diretor_turma || '',
      estado: turma.estado || 'ATIVO',
      observacao: turma.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedTurma(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedTurma) {
        await updateTurma(selectedTurma.id, buildPayload(form));
        setSuccess('Turma atualizada com sucesso.');
      } else {
        await createTurma(buildPayload(form));
        setSuccess('Turma criada com sucesso.');
      }

      closeModal();
      await loadTurmas(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(turma) {
    const confirmed = window.confirm(`Eliminar a turma "${turma.classe} ${turma.sala}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteTurma(turma.id);
      setSuccess('Turma eliminada com sucesso.');
      await loadTurmas(page);
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
        title="Turmas"
        breadcrumbs={['Turmas']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Nova Turma
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de turmas">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por classe, sala, ano, turno ou diretor"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select
          className="form-select"
          aria-label="Filtrar por periodo"
          value={periodo}
          onChange={(event) => resetAndSetPage(event, setPeriodo)}
        >
          <option value="">Todos os periodos</option>
          <option value="MANHA">Manha</option>
          <option value="TARDE">Tarde</option>
          <option value="NOITE">Noite</option>
        </select>
        <select
          className="form-select"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(event) => resetAndSetPage(event, setEstado)}
        >
          <option value="">Todos os estados</option>
          <option value="ATIVO">Ativas</option>
          <option value="INATIVO">Inativas</option>
        </select>
        <input
          className="form-control"
          aria-label="Filtrar por ano lectivo"
          placeholder="Ano lectivo"
          value={anoLectivo}
          onChange={(event) => resetAndSetPage(event, setAnoLectivo)}
        />
        <select
          className="form-select"
          aria-label="Ordenar turmas"
          value={ordering}
          onChange={(event) => resetAndSetPage(event, setOrdering)}
        >
          <option value="ano_lectivo">Ano lectivo</option>
          <option value="classe">Classe</option>
          <option value="sala">Sala</option>
          <option value="-created_at">Criacao recente</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadTurmas(page)}>
          <i className="bi bi-arrow-clockwise" />
          Atualizar
        </button>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Classe</th>
                <th>Turma/Sala</th>
                <th>Periodo</th>
                <th>Turno</th>
                <th>Ano Lectivo</th>
                <th>Diretor de Turma</th>
                <th>Capacidade</th>
                <th>Estado</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    A carregar turmas...
                  </td>
                </tr>
              )}

              {!isLoading && turmas.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-4">
                    Nenhuma turma encontrada.
                  </td>
                </tr>
              )}

              {!isLoading && turmas.map((turma) => (
                <tr key={turma.id}>
                  <td>
                    <strong>{turma.classe}</strong>
                  </td>
                  <td>{turma.sala}</td>
                  <td>{formatPeriodo(turma.periodo)}</td>
                  <td>{turma.turno || '-'}</td>
                  <td>{turma.ano_lectivo}</td>
                  <td>{turma.diretor_turma_info?.nome || '-'}</td>
                  <td>{turma.capacidade || '-'}</td>
                  <td>
                    <span className={`sigep-badge ${turma.estado === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>
                      {turma.estado === 'ATIVO' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/turmas/${turma.id}`}>
                        <i className="bi bi-eye" />
                        Ver
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(turma)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(turma)}>
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

      <nav aria-label="Paginacao de turmas" className="sigep-pagination">
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
        <TurmaFormModal
          mode={modalMode}
          form={form}
          professores={professores}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default TurmasPage;
