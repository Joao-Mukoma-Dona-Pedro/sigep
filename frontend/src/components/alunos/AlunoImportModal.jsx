import { useState } from 'react';

import { confirmAlunoImport, previewAlunoImport } from '../../services/alunoService';

function message(error) {
  return error.response?.data?.detail || 'Não foi possível processar a planilha.';
}

export default function AlunoImportModal({ mode, turmas, onClose, onComplete }) {
  const [turma, setTurma] = useState('');
  const [ficheiro, setFicheiro] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const title = mode === 'actualizar' ? 'Actualizar por Planilha' : 'Importar Alunos';

  async function handlePreview(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try { setPreview(await previewAlunoImport({ ficheiro, turma, modo: mode })); }
    catch (requestError) { setError(message(requestError)); }
    finally { setBusy(false); }
  }

  async function handleConfirm() {
    setBusy(true); setError('');
    try {
      const result = await confirmAlunoImport({ ficheiro, turma, modo: mode });
      onComplete(`${result.resumo.novos} alunos criados e ${result.resumo.actualizacoes} alunos actualizados.`);
    } catch (requestError) { setError(message(requestError)); setBusy(false); }
  }

  return <>
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <form className="modal-content sigep-modal" onSubmit={handlePreview}>
          <div className="modal-header"><div><p className="eyebrow mb-1">Alunos</p><h2 className="modal-title h5">{title}</h2></div><button className="btn-close" type="button" aria-label="Fechar" onClick={onClose} /></div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <p className="text-muted">Seleccione a turma e um ficheiro CSV ou XLSX. A base de dados só será alterada depois da confirmação.</p>
            <div className="row g-3 mb-4">
              <div className="col-md-6"><label className="form-label" htmlFor="import-turma">Turma</label><select id="import-turma" className="form-select" required value={turma} onChange={(e) => { setTurma(e.target.value); setPreview(null); }}><option value="">Seleccione uma turma</option>{turmas.map((item) => <option key={item.id} value={item.id}>{item.classe} {item.sala} — {item.ano_lectivo}</option>)}</select></div>
              <div className="col-md-6"><label className="form-label" htmlFor="import-file">Planilha</label><input id="import-file" className="form-control" type="file" accept=".csv,.xlsx" required onChange={(e) => { setFicheiro(e.target.files[0]); setPreview(null); }} /></div>
            </div>
            {preview && <>
              <div className="row g-3 mb-3">
                <div className="col"><div className="panel-card p-3"><strong>{preview.resumo.novos}</strong><div>Novos alunos</div></div></div>
                <div className="col"><div className="panel-card p-3"><strong>{preview.resumo.actualizacoes}</strong><div>Actualizações</div></div></div>
                <div className="col"><div className="panel-card p-3"><strong>{preview.resumo.sem_alteracoes}</strong><div>Sem alterações</div></div></div>
                <div className="col"><div className="panel-card p-3"><strong>{preview.resumo.erros}</strong><div>Erros</div></div></div>
              </div>
              {preview.resumo.erros > 0 && <div className="alert alert-warning">Corrija os erros antes de continuar.</div>}
              <div className="table-responsive"><table className="table sigep-table align-middle"><thead><tr><th>Linha</th><th>N.º</th><th>Nome</th><th>Estado</th><th>Detalhes</th></tr></thead><tbody>{preview.linhas.map((row) => <tr key={row.linha}><td>{row.linha}</td><td>{row.numero || '-'}</td><td>{row.nome || '-'}</td><td>{row.estado}</td><td>{row.erros?.join(' ') || Object.entries(row.alteracoes || {}).map(([field, values]) => `${field}: ${values.actual || 'vazio'} → ${values.novo}`).join('; ') || '-'}</td></tr>)}</tbody></table></div>
            </>}
          </div>
          <div className="modal-footer"><button className="btn btn-outline-secondary" type="button" onClick={onClose}>Cancelar</button>{!preview && <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'A validar...' : 'Pré-visualizar'}</button>}{preview && <button className="btn btn-primary" type="button" disabled={busy || preview.resumo.erros > 0} onClick={handleConfirm}>{busy ? 'A confirmar...' : 'Confirmar importação'}</button>}</div>
        </form>
      </div>
    </div><div className="modal-backdrop fade show" />
  </>;
}
