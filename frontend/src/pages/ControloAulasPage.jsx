import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createControloAula,
  deleteControloAula,
  listControlosAulas,
  listLecionacaoOptions,
  updateControloAula,
} from '../services/controloAulaService';

const initialForm = {
  lecionacao: '',
  data: '',
  aula_assistida: false,
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
    return 'Controlo de aula nao encontrado.';
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

function getLecionacaoLabel(lecionacao) {
  return `${lecionacao.professor} - ${lecionacao.disciplina} - ${lecionacao.turma} (${lecionacao.ano_lectivo})`;
}

function buildPayload(form) {
  return {
    lecionacao: form.lecionacao ? Number(form.lecionacao) : '',
    data: form.data,
    aula_assistida: Boolean(form.aula_assistida),
    observacao: form.observacao,
  };
}

function DerivedInfo({ lecionacao }) {
  if (!lecionacao) {
    return (
      <div className="alert alert-info mb-0">
        Selecione uma lecionacao para visualizar professor, disciplina, turma e ano lectivo.
      </div>
    );
  }

  return (
    <div className="detail-grid">
      <div className="detail-item">
        <span>Professor</span>
        <strong>{lecionacao.professor}</strong>
      </div>
      <div className="detail-item">
        <span>Disciplina</span>
        <strong>{lecionacao.disciplina}</strong>
      </div>
      <div className="detail-item">
        <span>Turma</span>
        <strong>{lecionacao.turma}</strong>
      </div>
      <div className="detail-item">
        <span>Ano Lectivo</span>
        <strong>{lecionacao.ano_lectivo}</strong>
      </div>
    </div>
  );
}

function ControloAulaFormModal({
  mode,
  form,
  lecionacoes,
  onChange,
  onCheckChange,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const title = mode === 'edit' ? 'Editar Controlo de Aula' : 'Novo Controlo de Aula';
  const selectedLecionacao = lecionacoes.find((item) => String(item.id) === String(form.lecionacao));

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Controlo de Aulas</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="lecionacao">LeccionaÃ§Ã£o</label>
                  <select
                    id="lecionacao"
                    className="form-select"
                    name="lecionacao"
                    value={form.lecionacao}
                    onChange={onChange}
                    required
                  >
                    <option value="">Selecione uma lecionacao</option>
                    {lecionacoes.map((lecionacao) => (
                      <option key={lecionacao.id} value={lecionacao.id}>
                        {getLecionacaoLabel(lecionacao)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <DerivedInfo lecionacao={selectedLecionacao} />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="data">Data</label>
                  <input
                    id="data"
                    className="form-control"
                    name="data"
                    type="date"
                    value={form.data}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <div className="form-check form-switch mb-2">
                    <input
                      id="aula_assistida"
                      className="form-check-input"
                      name="aula_assistida"
                      type="checkbox"
                      checked={form.aula_assistida}
                      onChange={onCheckChange}
                    />
                    <label className="form-check-label" htmlFor="aula_assistida">
                      Aula Assistida
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

function ControloAulasPage() {
  const [controlos, setControlos] = useState([]);
  const [lecionacoes, setLecionacoes] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [professor, setProfessor] = useState('');
  const [disciplina, setDisciplina] = useState('');
  const [turma, setTurma] = useState('');
  const [anoLectivo, setAnoLectivo] = useState('');
  const [data, setData] = useState('');
  const [aulaAssistida, setAulaAssistida] = useState('');
  const [ordering, setOrdering] = useState('-data');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedControlo, setSelectedControlo] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);
  const professorOptions = useMemo(
    () => Array.from(new Map(lecionacoes.map((item) => [item.professor_id, item])).values()),
    [lecionacoes],
  );
  const disciplinaOptions = useMemo(
    () => Array.from(new Map(lecionacoes.map((item) => [item.disciplina_id, item])).values()),
    [lecionacoes],
  );
  const turmaOptions = useMemo(
    () => Array.from(new Map(lecionacoes.map((item) => [item.turma_id, item])).values()),
    [lecionacoes],
  );
  const anoOptions = useMemo(
    () => [...new Set(lecionacoes.map((item) => item.ano_lectivo).filter(Boolean))].sort(),
    [lecionacoes],
  );

  async function loadControlos(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const response = await listControlosAulas({
        search,
        professor,
        disciplina,
        turma,
        ano_lectivo: anoLectivo,
        data,
        aula_assistida: aulaAssistida,
        ordering,
        page: targetPage,
      });
      setControlos(response.results || []);
      setPagination({ count: response.count || 0, next: response.next, previous: response.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLecionacoes() {
    try {
      const response = await listLecionacaoOptions();
      setLecionacoes(response);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  useEffect(() => {
    loadLecionacoes();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadControlos(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, professor, disciplina, turma, anoLectivo, data, aulaAssistida, ordering]);

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
    setSelectedControlo(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(controlo) {
    setSelectedControlo(controlo);
    setForm({
      lecionacao: controlo.lecionacao || '',
      data: controlo.data || '',
      aula_assistida: Boolean(controlo.aula_assistida),
      observacao: controlo.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedControlo(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedControlo) {
        await updateControloAula(selectedControlo.id, buildPayload(form));
        setSuccess('Controlo de aula atualizado com sucesso.');
      } else {
        await createControloAula(buildPayload(form));
        setSuccess('Controlo de aula criado com sucesso.');
      }

      closeModal();
      await loadControlos(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(controlo) {
    const label = controlo.lecionacao_info?.professor || 'registo selecionado';
    const confirmed = window.confirm(`Eliminar o controlo de aula de "${label}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteControloAula(controlo.id);
      setSuccess('Controlo de aula eliminado com sucesso.');
      await loadControlos(page);
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
        title="Controlo de Aulas"
        breadcrumbs={['Controlo de Aulas']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Novo Controlo de Aula
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de controlo de aulas">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por professor, disciplina, turma ou ano"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select className="form-select" value={professor} onChange={(event) => resetAndSetPage(event, setProfessor)}>
          <option value="">Todos os professores</option>
          {professorOptions.map((item) => (
            <option key={item.professor_id} value={item.professor_id}>{item.professor}</option>
          ))}
        </select>
        <select className="form-select" value={disciplina} onChange={(event) => resetAndSetPage(event, setDisciplina)}>
          <option value="">Todas as disciplinas</option>
          {disciplinaOptions.map((item) => (
            <option key={item.disciplina_id} value={item.disciplina_id}>{item.disciplina}</option>
          ))}
        </select>
        <select className="form-select" value={turma} onChange={(event) => resetAndSetPage(event, setTurma)}>
          <option value="">Todas as turmas</option>
          {turmaOptions.map((item) => (
            <option key={item.turma_id} value={item.turma_id}>{item.turma}</option>
          ))}
        </select>
        <select className="form-select" value={anoLectivo} onChange={(event) => resetAndSetPage(event, setAnoLectivo)}>
          <option value="">Todos os anos</option>
          {anoOptions.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input className="form-control" type="date" value={data} onChange={(event) => resetAndSetPage(event, setData)} />
        <select className="form-select" value={aulaAssistida} onChange={(event) => resetAndSetPage(event, setAulaAssistida)}>
          <option value="">Todas</option>
          <option value="true">Assistidas</option>
          <option value="false">NÃ£o assistidas</option>
        </select>
        <select className="form-select" value={ordering} onChange={(event) => resetAndSetPage(event, setOrdering)}>
          <option value="-data">Data recente</option>
          <option value="data">Data antiga</option>
          <option value="lecionacao__professor__nome">Professor</option>
          <option value="lecionacao__turma__classe">Turma</option>
          <option value="lecionacao__disciplina__nome">Disciplina</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadControlos(page)}>
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
                <th>Disciplina</th>
                <th>Turma</th>
                <th>Ano Lectivo</th>
                <th>Data</th>
                <th>Aula Assistida</th>
                <th>ObservaÃ§Ã£o</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">A carregar controlos de aulas...</td>
                </tr>
              )}

              {!isLoading && controlos.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">Nenhum controlo de aula encontrado.</td>
                </tr>
              )}

              {!isLoading && controlos.map((controlo) => (
                <tr key={controlo.id}>
                  <td><strong>{controlo.lecionacao_info?.professor || '-'}</strong></td>
                  <td>{controlo.lecionacao_info?.disciplina || '-'}</td>
                  <td>{controlo.lecionacao_info?.turma || '-'}</td>
                  <td>{controlo.lecionacao_info?.ano_lectivo || '-'}</td>
                  <td>{formatDate(controlo.data)}</td>
                  <td>
                    <span className={`sigep-badge ${controlo.aula_assistida ? 'badge-success' : 'badge-warning'}`}>
                      {controlo.aula_assistida ? 'Sim' : 'NÃ£o'}
                    </span>
                  </td>
                  <td>{controlo.observacao || '-'}</td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/controlo-aulas/${controlo.id}`}>
                        <i className="bi bi-eye" />
                        Ver
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(controlo)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(controlo)}>
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

      <nav aria-label="Paginacao de controlo de aulas" className="sigep-pagination">
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

      {modalMode && (
        <ControloAulaFormModal
          mode={modalMode}
          form={form}
          lecionacoes={lecionacoes}
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

export default ControloAulasPage;
