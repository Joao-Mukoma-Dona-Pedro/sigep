import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-stack">
      <PageHeader
        title="Configurações"
        breadcrumbs={['Configurações']}
      />
      <div className="settings-layout">
        <section className="panel-card">
          <div className="panel-card-header"><h2>Perfil</h2></div>
          <div className="profile-summary">
            <div className="user-avatar large">{user?.full_name?.charAt(0) || 'S'}</div>
            <div>
              <strong>{user?.full_name || 'Subdirector Pedagógico'}</strong>
              {user?.email && <span>{user.email}</span>}
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-6"><input className="form-control" defaultValue="Subdirector Pedagógico" /></div>
            <div className="col-md-6"><input className="form-control" defaultValue={user?.email || ''} /></div>
          </div>
        </section>
        <section className="panel-card">
          <div className="panel-card-header"><h2>Alteração de palavra-passe</h2></div>
          <div className="row g-3">
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Senha atual" /></div>
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Nova senha" /></div>
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Confirmar senha" /></div>
          </div>
        </section>
        <section className="panel-card">
          <div className="panel-card-header"><h2>Preferências</h2></div>
          <div className="settings-list">
            <label className="form-check form-switch">
              <input className="form-check-input" type="checkbox" defaultChecked />
              <span className="form-check-label">Receber avisos pedagógicos</span>
            </label>
            <label className="form-check form-switch">
              <input className="form-check-input" type="checkbox" defaultChecked />
              <span className="form-check-label">Mostrar resumo no dashboard</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
