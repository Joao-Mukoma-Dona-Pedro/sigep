import { Link } from 'react-router-dom';

function DataTable({ columns, rows, detailBasePath }) {
  return (
    <div className="table-card">
      <div className="table-responsive">
        <table className="table align-middle sigep-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th scope="col" key={column.key}>
                  {column.label}
                </th>
              ))}
              <th scope="col" className="text-end">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.badge ? (
                      <span className={`badge sigep-badge ${column.badge(row[column.key])}`}>{row[column.key]}</span>
                    ) : (
                      row[column.key]
                    )}
                  </td>
                ))}
                <td className="text-end">
                  {detailBasePath ? (
                    <Link className="btn btn-sm btn-outline-primary" to={`${detailBasePath}/${row.id}`}>
                      Ver
                    </Link>
                  ) : (
                    <button className="btn btn-sm btn-outline-secondary" type="button">
                      Preparado
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
