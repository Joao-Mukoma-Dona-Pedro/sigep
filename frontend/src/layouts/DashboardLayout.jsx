import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { moduleLinks } from '../config/modules';
import { useAuth } from '../context/AuthContext';

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SIGEP</strong>
            <small>Gestao Pedagogica</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Modulos do SIGEP">
          <NavLink to="/dashboard" end>
            Dashboard
          </NavLink>
          {moduleLinks.map((item) => (
            <NavLink key={item.path} to={item.path}>
              <span className={`module-dot ${item.color}`} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Administrador</p>
            <h2>Subdiretor Pedagogico</h2>
          </div>
          <div className="user-menu">
            <div className="user-avatar">{user?.full_name?.charAt(0) || 'S'}</div>
            <div>
              <strong>{user?.full_name || 'Subdiretor Pedagogico'}</strong>
              <small>{user?.email}</small>
            </div>
            <NavLink className="btn btn-outline-secondary btn-sm" to="/perfil">
              Perfil
            </NavLink>
            <button className="btn btn-primary btn-sm" type="button" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <section className="content-area">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

export default DashboardLayout;
