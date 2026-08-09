function PageHeader({ title, eyebrow, description, actions, breadcrumbs = [] }) {
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
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
