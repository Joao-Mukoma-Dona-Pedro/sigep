import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageHeader from '../components/ui/PageHeader';
import {
  confirmarImportacaoPCT,
  getPCT,
  lancarNotasPCT,
  listPCTAlunos,
  previewImportacaoPCT,
} from '../services/pctService';

function getErrorMessage(error) {
  if (!error.response) {
    return 'NÃ£o foi possÃ­vel conectar ao servidor. Verifique se o backend estÃ¡ ativo.';
  }

  if (error.response.status === 401) {
    return 'A sua sessÃ£o expirou. Entre novamente no SIGEP.';
  }

  if (error.response.status === 404) {
    return 'PCT nÃ£o encontrada.';
  }

  if (error.response.status === 400) {
    const data = error.response.data;
    if (data?.errors?.length) return data.errors[0].detail || 'Existem erros para corrigir.';
    if (data?.detail) return data.detail;
    const firstField = Object.keys(data || {})[0];
    const firstMessage = firstField ? data[firstField]?.[0] : null;
    return firstMessage || 'Verifique os dados enviados.';
  }

  return 'Ocorreu um erro ao carregar os dados da PCT.';
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO').format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatTrimestre(value) {
  const labels = {
    1: '1.Âº Trimestre',
    2: '2.Âº Trimestre',
    3: '3.Âº Trimestre',
  };
  return labels[value] || '-';
}

function getEstadoResultados(pct) {
  const labels = {
    NENHUM: 'NÃ£o lanÃ§ada',
    PARCIAL: 'Parcial',
    COMPLETO: 'Completa',
  };
  return labels[pct?.resultados_estado] || 'NÃ£o lanÃ§ada';
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  );
}

function ResultadosModal({ rows, onChange, onClose, onSubmit, isSubmitting }) {
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <form className="modal-content sigep-modal" onSubmit={onSubmit}>
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Resultados PCT</p>
                <h2 className="modal-title h5">LanÃ§ar Notas</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table sigep-table align-middle">
                  <thead>
                    <tr>
                      <th>N.</th>
                      <th>Aluno</th>
                      <th>Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.aluno_id}>
                        <td>{row.numero ?? '-'}</td>
                        <td><strong>{row.nome}</strong></td>
                        <td>
                          <input
                            className="form-control"
                            min="0"
                            name="nota"
                            type="number"
                            step="0.01"
                            value={row.nota}
                            onChange={(event) => onChange(row.aluno_id, event.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                <i className="bi bi-check2-circle" />
                {isSubmitting ? 'A guardar...' : 'Guardar Notas'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function ImportModal({
  file,
  preview,
  onFileChange,
  onPreview,
  onConfirm,
  onClose,
  isSubmitting,
}) {
  const hasErrors = Boolean(preview?.has_errors);

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content sigep-modal">
            <div className="modal-header">
              <div>
                <p className="eyebrow mb-1">Importacao</p>
                <h2 className="modal-title h5">Importar Notas</h2>
              </div>
              <button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label" htmlFor="ficheiro">Ficheiro Excel ou CSV</label>
                  <input
                    id="ficheiro"
                    className="form-control"
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={onFileChange}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button className="btn btn-outline-secondary w-100" type="button" onClick={onPreview} disabled={!file || isSubmitting}>
                    <i className="bi bi-search" />
                    PrÃ©-visualizar
                  </button>
                </div>
              </div>

              {preview && (
                <div className="table-responsive mt-4">
                  <table className="table sigep-table align-middle">
                    <thead>
                      <tr>
                        <th>Linha</th>
                        <th>N.</th>
                        <th>Aluno</th>
                        <th>Nota</th>
                        <th>Identificacao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row) => (
                        <tr key={row.linha}>
                          <td>{row.linha}</td>
                          <td>{row.numero || '-'}</td>
                          <td><strong>{row.aluno || '-'}</strong></td>
                          <td>{row.nota || '-'}</td>
                          <td>
                            <span className={`sigep-badge ${row.status === 'OK' ? 'badge-success' : 'badge-danger'}`}>
                              {row.status === 'OK' ? 'OK' : row.erros.join(', ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={!preview || hasErrors || isSubmitting}>
                <i className="bi bi-cloud-upload" />
                {isSubmitting ? 'A importar...' : 'Confirmar ImportaÃ§Ã£o'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

function PctDetailPage() {
  const { id } = useParams();
  const [pct, setPct] = useState(null);
  const [rows, setRows] = useState([]);
  const [editableRows, setEditableRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [pctData, alunosData] = await Promise.all([getPCT(id), listPCTAlunos(id)]);
      setPct(pctData);
      setRows(alunosData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  function openResultsModal() {
    setEditableRows(rows.map((row) => ({ ...row, nota: row.nota || '' })));
    setModalMode('results');
  }

  function openImportModal() {
    setFile(null);
    setPreview(null);
    setModalMode('import');
  }

  function closeModal() {
    setModalMode(null);
    setEditableRows([]);
    setFile(null);
    setPreview(null);
  }

  function handleNotaChange(alunoId, value) {
    setEditableRows((current) => current.map((row) => (
      row.aluno_id === alunoId ? { ...row, nota: value } : row
    )));
  }

  async function handleSaveNotas(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await lancarNotasPCT(id, editableRows.map((row) => ({ aluno: row.aluno_id, nota: row.nota })));
      setSuccess('Notas guardadas com sucesso.');
      closeModal();
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePreviewImport() {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = await previewImportacaoPCT(id, file);
      setPreview(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmImport() {
    if (!preview || preview.has_errors) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await confirmarImportacaoPCT(id, preview.rows);
      setSuccess('Notas importadas com sucesso.');
      closeModal();
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="PCT"
        breadcrumbs={['PCT', 'Detalhes']}
        actions={(
          <Link className="btn btn-outline-secondary" to="/pct">
            <i className="bi bi-arrow-left" />
            Voltar
          </Link>
        )}
      />

      {isLoading && (
        <section className="empty-state">
          <h2>A carregar PCT...</h2>
        </section>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!isLoading && pct && (
        <>
          <section className="profile-panel">
            <div className="profile-summary">
              <div className="user-avatar large">{pct.lecionacao_info?.professor?.charAt(0) || 'P'}</div>
              <div>
                <strong>{pct.lecionacao_info?.professor || 'Professor'}</strong>
                <span>{formatTrimestre(pct.trimestre)} - {getEstadoResultados(pct)} ({pct.resultados_count || 0}/{pct.alunos_count || 0})</span>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <DetailItem label="Professor" value={pct.lecionacao_info?.professor} />
            <DetailItem label="Disciplina" value={pct.lecionacao_info?.disciplina} />
            <DetailItem label="Classe" value={pct.lecionacao_info?.turma_classe} />
            <DetailItem label="Turma" value={pct.lecionacao_info?.turma} />
            <DetailItem label="Ano Lectivo" value={pct.lecionacao_info?.ano_lectivo} />
            <DetailItem label="Trimestre" value={formatTrimestre(pct.trimestre)} />
            <DetailItem label="Data de AplicaÃ§Ã£o" value={formatDate(pct.data_aplicacao)} />
            <DetailItem label="Estado das Notas" value={`${getEstadoResultados(pct)} - ${pct.resultados_count || 0}/${pct.alunos_count || 0}`} />
            <DetailItem label="Resultados" value={`${pct.resultados_count || 0}/${pct.alunos_count || 0}`} />
            <DetailItem label="Data de CriaÃ§Ã£o" value={formatDateTime(pct.created_at)} />
            <DetailItem label="Ãšltima AtualizaÃ§Ã£o" value={formatDateTime(pct.updated_at)} />
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <h2>ObservaÃ§Ã£o</h2>
            </div>
            <p className="mb-0 text-muted">{pct.observacao || 'Sem observaÃ§Ãµes registadas.'}</p>
          </section>

          <section className="panel-card">
            <div className="panel-card-header">
              <div>
                <h2>Resultados</h2>
                <p className="mb-0 text-muted">Notas individuais associadas a esta PCT.</p>
              </div>
              <div className="button-cluster">
                <button className="btn btn-outline-secondary" type="button" onClick={openImportModal}>
                  <i className="bi bi-upload" />
                  Importar Notas
                </button>
                <button className="btn btn-primary" type="button" onClick={openResultsModal}>
                  <i className="bi bi-pencil-square" />
                  {pct.resultados_count ? 'Editar Notas' : 'LanÃ§ar Notas'}
                </button>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table sigep-table align-middle">
                <thead>
                  <tr>
                    <th>N.</th>
                    <th>Aluno</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-muted py-4">Nenhum aluno encontrado para esta turma.</td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.aluno_id}>
                      <td>{row.numero ?? '-'}</td>
                      <td><strong>{row.nome}</strong></td>
                      <td>{row.nota || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {modalMode === 'results' && (
        <ResultadosModal
          rows={editableRows}
          onChange={handleNotaChange}
          onClose={closeModal}
          onSubmit={handleSaveNotas}
          isSubmitting={isSubmitting}
        />
      )}

      {modalMode === 'import' && (
        <ImportModal
          file={file}
          preview={preview}
          onFileChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setPreview(null);
          }}
          onPreview={handlePreviewImport}
          onConfirm={handleConfirmImport}
          onClose={closeModal}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default PctDetailPage;
