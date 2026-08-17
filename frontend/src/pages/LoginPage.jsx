import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch {
      setError('E-mail ou palavra-passe inválida.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Acesso restrito</p>
        <h2>Entrar no SIGEP</h2>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="form-floating">
        <input
          id="email"
          className="form-control"
          type="email"
          name="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          required
        />
        <label htmlFor="email">E-mail</label>
      </div>

      <div className="form-floating">
        <input
          id="password"
          className="form-control"
          type="password"
          name="password"
          placeholder="Palavra-passe"
          value={form.password}
          onChange={handleChange}
          required
        />
        <label htmlFor="password">Palavra-passe</label>
      </div>

      <button className="btn btn-primary btn-lg w-100" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'A entrar...' : 'Entrar'}
      </button>

      <Link className="auth-link" to="/recuperar-palavra-passe">
        Recuperar palavra-passe
      </Link>
    </form>
  );
}

export default LoginPage;
