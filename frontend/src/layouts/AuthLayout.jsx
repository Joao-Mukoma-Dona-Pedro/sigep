import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SIGEP</strong>
            <small>Gabinete Pedagógico</small>
          </div>
        </div>
        <Outlet />
      </section>
      <aside className="auth-aside" aria-label="Fluxo pedagógico">
        <div>
          <p className="eyebrow">Gestão Pedagógica</p>
          <h1>SUBDIRECTOR PEDAGÓGICO</h1>
          <p>
            Acesso administrativo ao SIGEP.
          </p>
        </div>
      </aside>
    </main>
  );
}

export default AuthLayout;
