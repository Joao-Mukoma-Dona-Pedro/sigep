function PageHeader({ title, actions, breadcrumbs = [] }) {
  return (
    <div className="page-heading">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb sigep-breadcrumb">
          <li className="breadcrumb-item">SIGEP</li>
          {breadcrumbs.map((item) => (
            <li className="breadcrumb-item active" aria-current="page" key={item}>
              {item}
            </li>
          ))}
        </ol>
      </nav>
      <div className="page-heading-row">
        <div>
          <h1>{title}</h1>
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
