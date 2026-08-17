import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { moduleLinks } from '../config/modules';
import { useAuth } from '../context/AuthContext';

function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">S</span>
          <div className="sidebar-text">
            <strong>SIGEP</strong>
            <small>Gestão Pedagógica</small>
          </div>
        </div>

        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <i className={`bi ${isCollapsed ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} aria-hidden="true" />
        </button>

        <nav className="sidebar-nav" aria-label="Módulos do SIGEP">
          <NavLink to="/dashboard" end title="Dashboard">
            <i className="bi bi-speedometer2" aria-hidden="true" />
            <span className="sidebar-text">Dashboard</span>
          </NavLink>
          {moduleLinks.map((item) => (
            <NavLink key={item.path} to={item.path} title={item.label}>
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span className="sidebar-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Administrador</p>
            <h2>Subdiretor/Diretor Pedagógico</h2>
          </div>
          <div className="user-menu">
            <div className="user-avatar">{user?.full_name?.charAt(0) || 'S'}</div>
            <div>
              <strong>{user?.full_name || 'Subdiretor/Diretor Pedagógico'}</strong>
              <small>{user?.email || 'admin@sigep.ao'}</small>
            </div>
            <NavLink className="btn btn-outline-secondary btn-sm" to="/configuracoes">
              <i className="bi bi-gear" aria-hidden="true" />
              Configurações
            </NavLink>
            <button className="btn btn-primary btn-sm" type="button" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>SIGEP - Sistema Integrado de Gestão Pedagógica</span>
          <span>Interface integrada com API</span>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayout;
