function Pagination() {
  return (
    <nav aria-label="Paginacao" className="sigep-pagination">
      <span>Mostrando 1-3 de 24 registos</span>
      <ul className="pagination pagination-sm mb-0">
        <li className="page-item disabled">
          <button className="page-link" type="button">Anterior</button>
        </li>
        <li className="page-item active">
          <button className="page-link" type="button">1</button>
        </li>
        <li className="page-item">
          <button className="page-link" type="button">2</button>
        </li>
        <li className="page-item">
          <button className="page-link" type="button">Seguinte</button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
