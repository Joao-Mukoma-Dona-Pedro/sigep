import DataTable from '../components/ui/DataTable';
import EntityModal from '../components/ui/EntityModal';
import PageHeader from '../components/ui/PageHeader';
import Pagination from '../components/ui/Pagination';
import Toolbar from '../components/ui/Toolbar';

function ManagementPage({ config }) {
  const action = config.modal ? (
    <button className="btn btn-primary" type="button" data-bs-toggle="modal" data-bs-target={`#${config.modal.id}`}>
      <i className="bi bi-plus-lg" aria-hidden="true" />
      {config.actionLabel}
    </button>
  ) : null;

  return (
    <div className="page-stack">
      <PageHeader
        title={config.title}
        eyebrow={config.eyebrow}
        description={config.description}
        breadcrumbs={[config.title]}
        actions={action}
      />
      <Toolbar searchPlaceholder={config.searchPlaceholder} filters={config.filters} />
      {config.extra}
      <DataTable columns={config.columns} rows={config.rows} detailBasePath={config.detailBasePath} />
      <Pagination />
      {config.modal && <EntityModal {...config.modal} />}
    </div>
  );
}

export default ManagementPage;
