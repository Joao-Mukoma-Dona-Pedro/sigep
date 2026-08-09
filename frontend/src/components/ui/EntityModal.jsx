function EntityModal({ id, title, fields }) {
  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-labelledby={`${id}-title`} aria-hidden="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content sigep-modal">
          <div className="modal-header">
            <div>
              <p className="eyebrow">Formulario preparado</p>
              <h2 className="modal-title fs-5" id={`${id}-title`}>{title}</h2>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Fechar" />
          </div>
          <div className="modal-body">
            <div className="row g-3">
              {fields.map((field) => (
                <div className="col-md-6" key={field.name}>
                  <label className="form-label" htmlFor={`${id}-${field.name}`}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="form-select" id={`${id}-${field.name}`} defaultValue="">
                      <option value="">Selecionar</option>
                      {field.options.map((option) => (
                        <option value={option} key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input className="form-control" id={`${id}-${field.name}`} type={field.type || 'text'} placeholder={field.placeholder || field.label} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" className="btn btn-primary">Guardar futuramente</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntityModal;
