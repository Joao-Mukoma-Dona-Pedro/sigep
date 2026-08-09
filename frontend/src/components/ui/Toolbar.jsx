function Toolbar({ searchPlaceholder = 'Pesquisar...', filters = [], action }) {
  return (
    <div className="sigep-toolbar">
      <div className="search-control">
        <i className="bi bi-search" aria-hidden="true" />
        <input className="form-control" type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder} />
      </div>
      {filters.map((filter) => (
        <select className="form-select" aria-label={filter.label} key={filter.label} defaultValue="">
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      ))}
      {action}
    </div>
  );
}

export default Toolbar;
