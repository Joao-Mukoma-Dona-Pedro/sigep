import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Perfil</p>
          <h1>{user?.full_name || 'Subdirector Pedagógico'}</h1>
        </div>
        <Link className="btn btn-primary" to="/alterar-palavra-passe">
          Alterar palavra-passe
        </Link>
      </section>

      <section className="profile-panel">
        <dl>
          <div>
            <dt>E-mail</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Perfil de acesso</dt>
            <dd>Subdirector Pedagógico</dd>
          </div>
          <div>
            <dt>Âmbito</dt>
            <dd>Gabinete Pedagógico</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default ProfilePage;
