import { useState } from 'react';
import { Link } from 'react-router-dom';

import { authService } from '../services/authService';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const response = await authService.requestPasswordReset(email);
      setMessage(response.detail);
    } catch {
      setError('Nao foi possivel processar o pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Seguranca</p>
        <h2>Recuperar palavra-passe</h2>
      </div>

      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="form-floating">
        <input
          id="reset-email"
          className="form-control"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label htmlFor="reset-email">E-mail</label>
      </div>

      <button className="btn btn-primary btn-lg w-100" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'A enviar...' : 'Enviar pedido'}
      </button>

      <Link className="auth-link" to="/login">
        Voltar ao login
      </Link>
    </form>
  );
}

export default ForgotPasswordPage;
