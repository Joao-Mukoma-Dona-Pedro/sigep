import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  createOcorrencia,
  deleteOcorrencia,
  listOcorrenciaAlunoOptions,
  listOcorrenciaProfessorOptions,
  listOcorrenciaTipoOptions,
  listOcorrencias,
  updateOcorrencia,
} from '../services/ocorrenciaService';

const initialForm = {
  aluno: '',
  tipo: '',
  data_ocorrencia: '',
  descricao: '',
  medida_tomada: '',
  registada_por: '',
  observacao: '',
};

const categorias = {
  DISCIPLINAR: 'Disciplinar',
  COMPORTAMENTAL: 'Comportamental',
  ACADEMICA: 'AcadÃ©mica',
  OUTROS: 'Outros',
};

function getErrorMessage(error) {
  if (!error.response) {
    return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessao expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'Ocorrencia nao encontrada.';
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

function getTurmaLabel(turma) {
  if (!turma) return '-';
  return `${turma.classe} ${turma.sala}`;
}

function getAlunoTurmaLabel(aluno) {
  if (!aluno?.turma_info) return '-';
  return getTurmaLabel(aluno.turma_info);
}

function getCategoriaLabel(value) {
  return categorias[value] || value || '-';
}

function buildPayload(form) {
  return {
    aluno: form.aluno ? Number(form.aluno) : '',
    tipo: form.tipo ? Number(form.tipo) : '',
    data_ocorrencia: form.data_ocorrencia,
    descricao: form.descricao,
    medida_tomada: form.medida_tomada,
    registada_por: form.registada_por ? Number(form.registada_por) : '',
    observacao: form.observacao,
  };
}

function DerivedInfo({ aluno, tipo }) {
  return (
    <div className="detail-grid">
      <div className="detail-item">
        <span>Turma</span>
        <strong>{getAlunoTurmaLabel(aluno)}</strong>
      </div>
      <div className="detail-item">
        <span>Classe</span>
        <strong>{aluno?.turma_info?.classe || '-'}</strong>
      </div>
      <div className="detail-item">
        <span>Categoria</span>
        <strong>{getCategoriaLabel(tipo?.categoria)}</strong>
      </div>
    </div>
  );
}

function OcorrenciaFormModal({
  mode,
  form,
  alunos,
  tipos,
  professores,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const title = mode === 'edit' ? 'Editar Ocorrencia' : 'Nova Ocorrencia';
  const selectedAluno = alunos.find((item) => String(item.id) === String(form.aluno));
  const selectedTipo = tipos.find((item) => String(item.id) === String(form.tipo));

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">OcorrÃªncias dos Alunos</p>
                <h2 className="modal-title h5">{title}</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="aluno">Aluno</label>
                  <select
                    id="aluno"
                    className="form-select"
                    name="aluno"
                    value={form.aluno}
                    onChange={onChange}
                    required
                  >
                    <option value="">Selecione um aluno</option>
                    {alunos.map((aluno) => (
                      <option key={aluno.id} value={aluno.id}>
                        {aluno.nome} - {getAlunoTurmaLabel(aluno)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="tipo">Tipo de Ocorrencia</label>
                  <select
                    id="tipo"
                    className="form-select"
                    name="tipo"
                    value={form.tipo}
                    onChange={onChange}
                    required
                  >
                    <option value="">Selecione um tipo</option>
                    {tipos.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.descricao} - {getCategoriaLabel(tipo.categoria)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <DerivedInfo aluno={selectedAluno} tipo={selectedTipo} />
                </div>

                <div className="col-md-6">
                  <label className="form-label" htmlFor="data_ocorrencia">Data da Ocorrencia</label>
                  <input
                    id="data_ocorrencia"
                    className="form-control"
                    name="data_ocorrencia"
                    type="date"
                    value={form.data_ocorrencia}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="registada_por">Registada por</label>
                  <select
                    id="registada_por"
                    className="form-select"
                    name="registada_por"
                    value={form.registada_por}
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
                <div className="col-12">
                  <label className="form-label" htmlFor="descricao">Descricao</label>
                  <textarea
                    id="descricao"
                    className="form-control"
                    name="descricao"
                    rows="4"
                    value={form.descricao}
                    onChange={onChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="medida_tomada">Medida Tomada</label>
                  <textarea
                    id="medida_tomada"
                    className="form-control"
                    name="medida_tomada"
                    rows="3"
                    value={form.medida_tomada}
                    onChange={onChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="observacao">ObservaÃ§Ã£o</label>
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

function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [aluno, setAluno] = useState('');
  const [turma, setTurma] = useState('');
  const [tipo, setTipo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [registadaPor, setRegistadaPor] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordering, setOrdering] = useState('-data_ocorrencia');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
  const [form, setForm] = useState(initialForm);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(pagination.count / 10)), [pagination.count]);
  const turmaOptions = useMemo(() => {
    const mapped = alunos
      .filter((item) => item.turma_info)
      .map((item) => [item.turma_info.id, item.turma_info]);
    return Array.from(new Map(mapped).values());
  }, [alunos]);
  const categoriaOptions = useMemo(
    () => [...new Set(tipos.map((item) => item.categoria).filter(Boolean))].sort(),
    [tipos],
  );

  async function loadOptions() {
    try {
      const [alunosData, tiposData, professoresData] = await Promise.all([
        listOcorrenciaAlunoOptions(),
        listOcorrenciaTipoOptions(),
        listOcorrenciaProfessorOptions(),
      ]);
      setAlunos(alunosData);
      setTipos(tiposData);
      setProfessores(professoresData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function loadOcorrencias(targetPage = page) {
    setIsLoading(true);
    setError('');

    try {
      const response = await listOcorrencias({
        search,
        aluno,
        turma,
        tipo,
        categoria,
        registada_por: registadaPor,
        data_inicio: dataInicio,
        data_fim: dataFim,
        ordering,
        page: targetPage,
      });
      setOcorrencias(response.results || []);
      setPagination({ count: response.count || 0, next: response.next, previous: response.previous });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadOcorrencias(page);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [page, search, aluno, turma, tipo, categoria, registadaPor, dataInicio, dataFim, ordering]);

  function resetAndSetPage(event, setter) {
    setPage(1);
    setter(event.target.value);
  }

  function handleFormChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function openCreateModal() {
    setSelectedOcorrencia(null);
    setForm(initialForm);
    setModalMode('create');
  }

  function openEditModal(ocorrencia) {
    setSelectedOcorrencia(ocorrencia);
    setForm({
      aluno: ocorrencia.aluno || '',
      tipo: ocorrencia.tipo || '',
      data_ocorrencia: ocorrencia.data_ocorrencia || '',
      descricao: ocorrencia.descricao || '',
      medida_tomada: ocorrencia.medida_tomada || '',
      registada_por: ocorrencia.registada_por || '',
      observacao: ocorrencia.observacao || '',
    });
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setSelectedOcorrencia(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (modalMode === 'edit' && selectedOcorrencia) {
        await updateOcorrencia(selectedOcorrencia.id, buildPayload(form));
        setSuccess('Ocorrencia atualizada com sucesso.');
      } else {
        await createOcorrencia(buildPayload(form));
        setSuccess('Ocorrencia criada com sucesso.');
      }

      closeModal();
      await loadOcorrencias(page);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(ocorrencia) {
    const label = ocorrencia.aluno_info?.nome || 'registo selecionado';
    const confirmed = window.confirm(`Eliminar a ocorrencia de "${label}"?`);
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteOcorrencia(ocorrencia.id);
      setSuccess('Ocorrencia eliminada com sucesso.');
      await loadOcorrencias(page);
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
        title="OcorrÃªncias"
        breadcrumbs={['OcorrÃªncias']}
        actions={(
          <button className="btn btn-primary" type="button" onClick={openCreateModal}>
            <i className="bi bi-plus-lg" />
            Nova Ocorrencia
          </button>
        )}
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="sigep-toolbar" aria-label="Filtros de ocorrencias">
        <div className="search-control">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            className="form-control"
            type="search"
            placeholder="Pesquisar por aluno, tipo, categoria ou descricao"
            value={search}
            onChange={(event) => resetAndSetPage(event, setSearch)}
          />
        </div>
        <select className="form-select" value={aluno} onChange={(event) => resetAndSetPage(event, setAluno)}>
          <option value="">Todos os alunos</option>
          {alunos.map((item) => (
            <option key={item.id} value={item.id}>{item.nome}</option>
          ))}
        </select>
        <select className="form-select" value={turma} onChange={(event) => resetAndSetPage(event, setTurma)}>
          <option value="">Todas as turmas</option>
          {turmaOptions.map((item) => (
            <option key={item.id} value={item.id}>{getTurmaLabel(item)}</option>
          ))}
        </select>
        <select className="form-select" value={tipo} onChange={(event) => resetAndSetPage(event, setTipo)}>
          <option value="">Todos os tipos</option>
          {tipos.map((item) => (
            <option key={item.id} value={item.id}>{item.descricao}</option>
          ))}
        </select>
        <select className="form-select" value={categoria} onChange={(event) => resetAndSetPage(event, setCategoria)}>
          <option value="">Todas as categorias</option>
          {categoriaOptions.map((item) => (
            <option key={item} value={item}>{getCategoriaLabel(item)}</option>
          ))}
        </select>
        <select className="form-select" value={registadaPor} onChange={(event) => resetAndSetPage(event, setRegistadaPor)}>
          <option value="">Todos os professores</option>
          {professores.map((item) => (
            <option key={item.id} value={item.id}>{item.nome}</option>
          ))}
        </select>
        <input className="form-control" type="date" value={dataInicio} onChange={(event) => resetAndSetPage(event, setDataInicio)} />
        <input className="form-control" type="date" value={dataFim} onChange={(event) => resetAndSetPage(event, setDataFim)} />
        <select className="form-select" value={ordering} onChange={(event) => resetAndSetPage(event, setOrdering)}>
          <option value="-data_ocorrencia">Data recente</option>
          <option value="data_ocorrencia">Data antiga</option>
          <option value="aluno__nome">Aluno</option>
          <option value="tipo__descricao">Tipo</option>
          <option value="registada_por__nome">Professor</option>
        </select>
        <button className="btn btn-outline-secondary" type="button" onClick={() => loadOcorrencias(page)}>
          <i className="bi bi-arrow-clockwise" />
          Atualizar
        </button>
      </section>

      <section className="table-card">
        <div className="table-responsive">
          <table className="table sigep-table align-middle">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Classe</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Data</th>
                <th>Registada por</th>
                <th className="text-end">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">A carregar ocorrencias...</td>
                </tr>
              )}

              {!isLoading && ocorrencias.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-4">Nenhuma ocorrencia encontrada.</td>
                </tr>
              )}

              {!isLoading && ocorrencias.map((ocorrencia) => (
                <tr key={ocorrencia.id}>
                  <td><strong>{ocorrencia.aluno_info?.nome || '-'}</strong></td>
                  <td>{ocorrencia.aluno_info?.turma || '-'}</td>
                  <td>{ocorrencia.aluno_info?.classe || '-'}</td>
                  <td>{ocorrencia.tipo_info?.descricao || '-'}</td>
                  <td>
                    <span className="sigep-badge badge-info">
                      {getCategoriaLabel(ocorrencia.tipo_info?.categoria)}
                    </span>
                  </td>
                  <td>{formatDate(ocorrencia.data_ocorrencia)}</td>
                  <td>{ocorrencia.registada_por_info?.nome || '-'}</td>
                  <td>
                    <div className="button-cluster justify-content-end">
                      <Link className="btn btn-sm btn-outline-secondary" to={`/ocorrencias/${ocorrencia.id}`}>
                        <i className="bi bi-eye" />
                        Ver
                      </Link>
                      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => openEditModal(ocorrencia)}>
                        <i className="bi bi-pencil" />
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(ocorrencia)}>
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

      <nav aria-label="Paginacao de ocorrencias" className="sigep-pagination">
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
        <OcorrenciaFormModal
          mode={modalMode}
          form={form}
          alunos={alunos}
          tipos={tipos}
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

export default OcorrenciasPage;
