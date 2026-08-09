import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">S</span>
          <div>
            <strong>SIGEP</strong>
            <small>Gabinete Pedagogico</small>
          </div>
        </div>
        <Outlet />
      </section>
      <aside className="auth-aside" aria-label="Fluxo pedagogico">
        <div>
          <p className="eyebrow">Gestao Pedagogica</p>
          <h1>Sistema de apoio ao Subdiretor/Diretor Pedagogico</h1>
          <p>
            Acesso administrativo para acompanhamento de professores, turmas,
            alunos, planificacoes, aulas, PCT, ocorrencias, reunioes e relatorios.
          </p>
        </div>
      </aside>
    </main>
  );
}

export default AuthLayout;
