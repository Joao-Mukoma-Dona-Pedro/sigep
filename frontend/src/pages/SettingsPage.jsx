import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-stack">
      <PageHeader
        title="Configuracoes"
        eyebrow="Perfil e preferencias"
        description="Area visual preparada para configuracoes do Gabinete Pedagogico."
        breadcrumbs={['Configuracoes']}
      />
      <div className="settings-layout">
        <section className="panel-card">
          <div className="panel-card-header"><h2>Perfil</h2></div>
          <div className="profile-summary">
            <div className="user-avatar large">{user?.full_name?.charAt(0) || 'S'}</div>
            <div>
              <strong>{user?.full_name || 'Subdiretor/Diretor Pedagogico'}</strong>
              <span>{user?.email || 'admin@sigep.ao'}</span>
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-6"><input className="form-control" defaultValue="Subdiretor/Diretor Pedagogico" /></div>
            <div className="col-md-6"><input className="form-control" defaultValue={user?.email || 'admin@sigep.ao'} /></div>
          </div>
        </section>
        <section className="panel-card">
          <div className="panel-card-header"><h2>Alteracao de senha</h2></div>
          <div className="row g-3">
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Senha atual" /></div>
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Nova senha" /></div>
            <div className="col-md-4"><input className="form-control" type="password" placeholder="Confirmar senha" /></div>
          </div>
        </section>
        <section className="panel-card">
          <div className="panel-card-header"><h2>Preferencias</h2></div>
          <div className="settings-list">
            <label className="form-check form-switch">
              <input className="form-check-input" type="checkbox" defaultChecked />
              <span className="form-check-label">Receber avisos pedagogicos</span>
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
