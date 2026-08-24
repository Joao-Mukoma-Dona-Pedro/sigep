import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import AssistantWidget from '../components/assistant/AssistantWidget';
import { moduleLinks } from '../config/modules';
import { AssistantProvider } from '../context/AssistantContext';
import { useAuth } from '../context/AuthContext';

function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AssistantProvider>
      <div className={`app-shell ${isCollapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-mobile-open' : ''}`}>
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
            <NavLink to="/dashboard" end title="Dashboard" onClick={() => setIsMobileOpen(false)}>
              <i className="bi bi-speedometer2" aria-hidden="true" />
              <span className="sidebar-text">Dashboard</span>
            </NavLink>
            {moduleLinks.map((item) => (
              <NavLink key={item.path} to={item.path} title={item.label} onClick={() => setIsMobileOpen(false)}>
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span className="sidebar-text">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="topbar-leading">
              <button className="mobile-menu-button" type="button" onClick={() => setIsMobileOpen(true)} aria-label="Abrir menu de navegação"><i className="bi bi-list" /></button>
              <div>
                <span className="topbar-role">SUBDIRECTOR PEDAGÓGICO</span>
                <small>Painel de gestão escolar</small>
              </div>
            </div>
            <div className="user-menu">
              <div className="user-avatar">{user?.full_name?.charAt(0) || 'S'}</div>
              <div>
                <strong>{user?.full_name || 'Subdirector Pedagógico'}</strong>
                {user?.email && <small>{user.email}</small>}
              </div>
              <NavLink className="btn btn-outline-secondary btn-sm topbar-action" to="/configuracoes" aria-label="Configurações">
                <i className="bi bi-gear" aria-hidden="true" />
                Configurações
              </NavLink>
              <button className="btn btn-outline-secondary btn-sm topbar-action" type="button" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" aria-hidden="true" />
                Sair
              </button>
            </div>
          </header>

          <main className="content-area">
            <Outlet />
          </main>

          <footer className="app-footer">
            <span>SIGEP - Sistema de Gestão Pedagógica</span>
          </footer>
        </div>

        <AssistantWidget />
        {isMobileOpen && <button className="sidebar-overlay" type="button" aria-label="Fechar menu" onClick={() => setIsMobileOpen(false)} />}
      </div>
    </AssistantProvider>
  );
}

export default DashboardLayout;
