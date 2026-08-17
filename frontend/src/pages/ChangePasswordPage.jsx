import { useState } from 'react';

function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('A nova palavra-passe e a confirmacao nao coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      setMessage('Estrutura visual preparada para alteracao de palavra-passe.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setError('Não foi possível alterar a palavra-passe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Seguranca</p>
          <h1>Alterar palavra-passe</h1>
        </div>
      </section>

      <form className="settings-form" onSubmit={handleSubmit}>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-floating">
          <input
            id="currentPassword"
            className="form-control"
            type="password"
            name="currentPassword"
            placeholder="Palavra-passe atual"
            value={form.currentPassword}
            onChange={handleChange}
            required
          />
          <label htmlFor="currentPassword">Palavra-passe atual</label>
        </div>

        <div className="form-floating">
          <input
            id="newPassword"
            className="form-control"
            type="password"
            name="newPassword"
            placeholder="Nova palavra-passe"
            value={form.newPassword}
            onChange={handleChange}
            required
          />
          <label htmlFor="newPassword">Nova palavra-passe</label>
        </div>

        <div className="form-floating">
          <input
            id="confirmPassword"
            className="form-control"
            type="password"
            name="confirmPassword"
            placeholder="Confirmar palavra-passe"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <label htmlFor="confirmPassword">Confirmar palavra-passe</label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'A guardar...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}

export default ChangePasswordPage;
