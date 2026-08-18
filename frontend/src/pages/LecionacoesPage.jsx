import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createLecionacao,
  deleteLecionacao,
  listLecionacaoDisciplinas,
  listLecionacaoProfessores,
  listLecionacaoTurmas,
  listLecionacoes,
  updateLecionacao,
} from '../services/lecionacaoService';

const initialForm = {
  professor: '',
  disciplina: '',
  turma: '',
  estado: 'ATIVO',
  observacao: '',
};

function getErrorMessage(error) {
  if (!error.response) return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  if (error.response.status === 401) return 'A sua sessÃ£o expirou. Entre novamente no SIGEP.';
  if (error.response.status === 404) return 'LeccionaÃ§Ã£o nÃ£o encontrada.';
  if (error.response.status === 409) return error.response.data?.detail || 'NÃ£o foi possÃ­vel eliminar esta leccionaÃ§Ã£o.';
  if (error.response.status === 400) {
    const data = error.response.data;
    if (data?.detail) return data.detail;
    if (Array.isArray(data?.non_field_errors)) return data.non_field_errors[0];
    const firstField = Object.keys(data || {})[0];
    const firstMessage = firstField ? data[firstField]?.[0] : null;
    return firstMessage || 'Verifique os dados do formulÃ¡rio.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

function getTurmaLabel(turma) {
  if (!turma) return '-';
  return `${turma.classe} ${turma.sala}`;
}

function buildPayload(form) {
  return {
    professor: form.professor ? Number(form.professor) : '',
    disciplina: form.disciplina ? Number(form.disciplina) : '',
    turma: form.turma ? Number(form.turma) : '',
    estado: form.estado,
    observacao: form.observacao,
  };
}

function DerivedInfo({ turma }) {
  return (
    <div className="detail-grid">
      <div className="detail-item"><span>Classe</span><strong>{turma?.classe || '-'}</strong></div>
      <div className="detail-item"><span>Sala</span><strong>{turma?.sala || '-'}</strong></div>
      <div className="detail-item"><span>Ano Lectivo</span><strong>{turma?.ano_lectivo || '-'}</strong></div>
      <div className="detail-item"><span>HorÃ¡rio</span><strong>{turma?.horario || 'HorÃ¡rio Regular'}</strong></div>
    </div>
  );
}

function LecionacaoFormModal({ mode, form, professores, disciplinas, turmas, onChange, onClose, onSubmit, isSubmitting }) {
  const title = mode === 'edit' ? 'Editar LeccionaÃ§Ã£o' : 'Nova LeccionaÃ§Ã£o';
  const selectedTurma = turmas.find((item) => String(item.id) === String(form.turma));

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">LeccionaÃ§Ãµes</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="professor">Professor</label>
                  <select id="professor" className="form-select" name="professor" value={form.professor} onChange={onChange} required>
                    <option value="">Selecione um professor</option>
                    {professores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="disciplina">Disciplina</label>
                  <select id="disciplina" className="form-select" name="disciplina" value={form.disciplina} onChange={onChange} required>
                    <option value="">Selecione uma disciplina</option>
                    {disciplinas.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="turma">Turma</label>
                  <select id="turma" className="form-select" name="turma" value={form.turma} onChange={onChange} required>
                    <option value="">Selecione uma turma</option>
                    {turmas.map((item) => <option key={item.id} value={item.id}>{getTurmaLabel(item)}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="estado">Estado</label>
                  <select id="estado" className="form-select" name="estado" value={form.estado} onChange={onChange}>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </select>
                </div>
                <div className="col-12">
                  <DerivedInfo turma={selectedTurma} />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="observacao">ObservaÃ§Ã£o</label>
                  <textarea id="observacao" className="form-control" name="observacao" rows="4" value={form.observacao} onChange={onChange} />
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

function LecionacoesPage() {
  const [lecionacoes, setLecionacoes] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [classe, setClasse] = useState('');
  const [anoLectivo, setAnoLectivo] = useState('');
  const [estado, setEstado] = useState('');
  const [ordering, setOrdering] = useState('ano_lectivo');
  const [modalMode, setModalMode] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);
  const classes = useMemo(() => [...new Set(turmas.map((item) => item.classe).filter(Boolean))].sort(), [turmas]);
  const anos = useMemo(() => [...new Set(turmas.map((item) => item.ano_lectivo).filter(Boolean))].sort(), [turmas]);

  async function loadOptions() {
    try {
      const [professoresData, disciplinasData, turmasData] = await Promise.all([
        listLecionacaoProfessores(),
        listLecionacaoDisciplinas(),
        listLecionacaoTurmas(),
      ]);
      setProfessores(professoresData);
      setDisciplinas(disciplinasData);
      setTurmas(turmasData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function loadLecionacoes(targetPage = page) {
    setIsLoading(true);
    setError('');
    try {
      const response = await listLecionacoes({ search, classe, ano_lectivo: anoLectivo, estado, ordering, page: targetPage });
      setLecionacoes(response.results || []);
      setPagination({ count: response.count || 0, next: response.next, previous: response.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadOptions(); }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => loadLecionacoes(page), 350);
    return () => window.clearTimeout(timeout);
  }, [page, search, classe, anoLectivo, estado, ordering]);

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

  function openEditModal(lecionacao) {
    setSelected(lecionacao);
    setForm({
      professor: lecionacao.professor || '',
      disciplina: lecionacao.disciplina || '',
      turma: lecionacao.turma || '',
      estado: lecionacao.estado || 'ATIVO',
      observacao: lecionacao.observacao || '',
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
        await updateLecionacao(selected.id, buildPayload(form));
        setSuccess('LeccionaÃ§Ã£o atualizada com sucesso.');
      } else {
        await createLecionacao(buildPayload(form));
        setSuccess('LeccionaÃ§Ã£o criada com sucesso.');
      }
      closeModal();
      await loadLecionacoes(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(lecionacao) {
    const confirmed = window.confirm(`Eliminar a leccionaÃ§Ã£o de "${lecionacao.professor_info?.nome}"?`);
    if (!confirmed) return;
    setError('');
    setSuccess('');
    try {
      await deleteLecionacao(lecionacao.id);
      setSuccess('LeccionaÃ§Ã£o eliminada com sucesso.');
      await loadLecionacoes(page);
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
        title="LeccionaÃ§Ãµes"
        breadcrumbs={['LeccionaÃ§Ãµes']}
        actions={<button className="btn btn-primary" type="button" onClick={openCreateModal}><i className="bi bi-plus-lg" />Nova LeccionaÃ§Ã£o</button>}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de leccionaÃ§Ãµes">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input className="form-control" type="search" placeholder="Pesquisar por professor, disciplina, turma ou ano" value={search} onChange={(event) => resetAndSetPage(event, setSearch)} />
        </div>
        <select className="form-select" value={classe} onChange={(event) => resetAndSetPage(event, setClasse)}>
          <option value="">Todas as classes</option>
          {classes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="form-select" value={anoLectivo} onChange={(event) => resetAndSetPage(event, setAnoLectivo)}>
          <option value="">Todos os anos</option>
          {anos.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="form-select" value={estado} onChange={(event) => resetAndSetPage(event, setEstado)}>
          <option value="">Todos os estados</option>
          <option value="ATIVO">Ativas</option>
          <option value="INATIVO">Inativas</option>
        </select>
        <select className="form-select" value={ordering} onChange={(event) => resetAndSetPage(event, setOrdering)}>
          <option value="ano_lectivo">Ano Lectivo</option>
          <option value="professor__nome">Professor</option>
          <option value="disciplina__nome">Disciplina</option>
          <option value="turma__classe">Turma</option>
        </select>
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
                <th>HorÃ¡rio</th>
                <th>Estado</th>
                <th className="text-end">AÃ§Ãµes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan="7" className="text-center text-muted py-4">A carregar leccionaÃ§Ãµes...</td></tr>}
              {!isLoading && lecionacoes.length === 0 && <tr><td colSpan="7" className="text-center text-muted py-4">Nenhuma leccionaÃ§Ã£o encontrada.</td></tr>}
              {!isLoading && lecionacoes.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.professor_info?.nome || '-'}</strong></td>
                  <td>{item.disciplina_info?.nome || '-'}</td>
                  <td>{item.turma_info ? getTurmaLabel(item.turma_info) : '-'}</td>
                  <td>{item.ano_lectivo}</td>
                  <td>{item.horario}</td>
                  <td><span className={`sigep-badge ${item.estado === 'ATIVO' ? 'badge-success' : 'badge-danger'}`}>{item.estado === 'ATIVO' ? 'Ativa' : 'Inativa'}</span></td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/leccionacoes/${item.id}`}><i className="bi bi-eye" />Ver</Link>
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

      <nav aria-label="PaginaÃ§Ã£o de leccionaÃ§Ãµes" className="sigep-pagination">
        <span>{pagination.count} registo{pagination.count === 1 ? '' : 's'} encontrado{pagination.count === 1 ? '' : 's'}</span>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${!pagination.previous ? 'disabled' : ''}`}><button className="page-link" type="button" onClick={() => changePage(page - 1)}>Anterior</button></li>
          <li className="page-item active"><button className="page-link" type="button">{page} / {totalPages}</button></li>
          <li className={`page-item ${!pagination.next ? 'disabled' : ''}`}><button className="page-link" type="button" onClick={() => changePage(page + 1)}>Seguinte</button></li>
        </ul>
      </nav>

      {modalMode && (
        <LecionacaoFormModal
          mode={modalMode}
          form={form}
          professores={professores}
          disciplinas={disciplinas}
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

export default LecionacoesPage;
