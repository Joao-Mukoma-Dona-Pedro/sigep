import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createAluno,
  deleteAluno,
  listAlunos,
  listTurmaOptions,
  updateAluno,
} from '../services/alunoService';

const initialForm = {
  numero: '',
  nome: '',
  turma: '',
  data_nascimento: '',
  sexo: '',
  encarregado_educacao: '',
  telefone_encarregado: '',
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
    return 'Aluno nao encontrado.';
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

function formatSexo(value) {
  const labels = {
    M: 'Masculino',
    F: 'Feminino',
  };
  return labels[value] || '-';
}

function buildPayload(form) {
  return {
    turma: form.turma ? Number(form.turma) : '',
    numero: form.numero ? Number(form.numero) : null,
    nome: form.nome,
    data_nascimento: form.data_nascimento || null,
    sexo: form.sexo,
    encarregado_educacao: form.encarregado_educacao,
    telefone_encarregado: form.telefone_encarregado,
    estado: form.estado,
    observacao: form.observacao,
  };
}

function getTurmaLabel(turma) {
  return `${turma.classe} ${turma.sala}`;
}

function AlunoFormModal({ mode, form, turmas, onChange, onClose, onSubmit, isSubmitting }) {
  const title = mode === 'edit' ? 'Editar Aluno' : 'Novo Aluno';

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Alunos</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" htmlFor="numero">Numero</label>
                  <input
                    id="numero"
                    className="form-control"
                    min="1"
                    name="numero"
                    type="number"
                    value={form.numero}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-8">
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
                  <label className="form-label" htmlFor="turma">Turma</label>
                  <select
                    id="turma"
                    className="form-select"
                    name="turma"
                    value={form.turma}
                    onChange={onChange}
                    required
                  >
                    <option value="">Selecione uma turma</option>
                    {turmas.map((turma) => (
                      <option key={turma.id} value={turma.id}>
                        {getTurmaLabel(turma)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="data_nascimento">Data de Nascimento</label>
                  <input
                    id="data_nascimento"
                    className="form-control"
                    name="data_nascimento"
                    type="date"
                    value={form.data_nascimento || ''}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="sexo">Sexo</label>
                  <select
                    id="sexo"
                    className="form-select"
                    name="sexo"
                    value={form.sexo}
                    onChange={onChange}
                  >
                    <option value="">NÃ£o informado</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
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
                <div className="col-md-6">
                  <label className="form-label" htmlFor="encarregado_educacao">Encarregado de Educacao</label>
                  <input
                    id="encarregado_educacao"
                    className="form-control"
                    name="encarregado_educacao"
                    value={form.encarregado_educacao}
                    onChange={onChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="telefone_encarregado">Telefone do Encarregado</label>
                  <input
                    id="telefone_encarregado"
                    className="form-control"
                    name="telefone_encarregado"
                    value={form.telefone_encarregado}
                    onChange={onChange}
                  />
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

function AlunosPage() {
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [turma, setTurma] = useState('');
  const [classe, setClasse] = useState('');
  const [estado, setEstado] = useState('');
  const [ordering, setOrdering] = useState('nome');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);
  const classes = useMemo(
    () => [...new Set(turmas.map((item) => item.classe).filter(Boolean))].sort(),
    [turmas],
  );

  async function loadAlunos(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const data = await listAlunos({ search, turma, classe, estado, ordering, page: targetPage });
      setAlunos(data.results || []);
      setPagination({ count: data.count || 0, next: data.next, previous: data.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTurmas() {
    try {
      const data = await listTurmaOptions();
      setTurmas(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadAlunos(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, turma, classe, estado, ordering]);

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function resetAndSetPage(event, setter) {
    setPage(1);
    setter(event.target.value);
  }

  function openCreateModal() {
    setSelectedAluno(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(aluno) {
    setSelectedAluno(aluno);
    setForm({
      numero: aluno.numero ?? '',
      nome: aluno.nome || '',
      turma: aluno.turma || '',
      data_nascimento: aluno.data_nascimento || '',
      sexo: aluno.sexo || '',
      encarregado_educacao: aluno.encarregado_educacao || '',
      telefone_encarregado: aluno.telefone_encarregado || '',
      estado: aluno.estado || 'ATIVO',
      observacao: aluno.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedAluno(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedAluno) {
        await updateAluno(selectedAluno.id, buildPayload(form));
        setSuccess('Aluno atualizado com sucesso.');
      } else {
        await createAluno(buildPayload(form));
        setSuccess('Aluno criado com sucesso.');
      }

      closeModal();
      await loadAlunos(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(aluno) {
    const confirmed = window.confirm(`Eliminar o aluno "${aluno.nome}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteAluno(aluno.id);
      setSuccess('Aluno eliminado com sucesso.');
      await loadAlunos(page);
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
        title="Alunos"
        breadcrumbs={['Alunos']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Novo Aluno
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de alunos">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por nome, numero, turma ou encarregado"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select
          className="form-select"
          aria-label="Filtrar por turma"
          value={turma}
          onChange={(event) => resetAndSetPage(event, setTurma)}
        >
          <option value="">Todas as turmas</option>
          {turmas.map((item) => (
            <option key={item.id} value={item.id}>
              {getTurmaLabel(item)}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          aria-label="Filtrar por classe"
          value={classe}
          onChange={(event) => resetAndSetPage(event, setClasse)}
        >
          <option value="">Todas as classes</option>
          {classes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          aria-label="Filtrar por estado"
          value={estado}
          onChange={(event) => resetAndSetPage(event, setEstado)}
        >
          <option value="">Todos os estados</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
        <select
          className="form-select"
          aria-label="Ordenar alunos"
          value={ordering}
          onChange={(event) => resetAndSetPage(event, setOrdering)}
        >
          <option value="nome">Nome A-Z</option>
          <option value="numero">Numero</option>
          <option value="data_nascimento">Data de nascimento</option>
          <option value="-created_at">Criacao recente</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadAlunos(page)}>
          <i className="bi bi-arrow-clockwise" />
          Atualizar
        </button>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Numero</th>
                <th>Nome</th>
                <th>Classe</th>
                <th>Turma</th>
                <th>Encarregado de Educacao</th>
                <th>Telefone do Encarregado</th>
                <th>Estado</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    A carregar alunos...
                  </td>
                </tr>
              )}

              {!isLoading && alunos.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}

              {!isLoading && alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>{aluno.numero ?? '-'}</td>
                  <td>
                    <strong>{aluno.nome}</strong>
                  </td>
                  <td>{aluno.turma_info?.classe || '-'}</td>
                  <td>{aluno.turma_info ? getTurmaLabel(aluno.turma_info) : '-'}</td>
                  <td>{aluno.encarregado_educacao || '-'}</td>
                  <td>{aluno.telefone_encarregado || '-'}</td>
                  <td>
                    <span className={`sigep-badge ${aluno.estado === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>
                      {aluno.estado === 'ATIVO' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/alunos/${aluno.id}`}>
                        <i className="bi bi-eye" />
                        Ver
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(aluno)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(aluno)}>
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

      <nav aria-label="Paginacao de alunos" className="sigep-pagination">
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
        <AlunoFormModal
          mode={modalMode}
          form={form}
          turmas={turmas}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default AlunosPage;
