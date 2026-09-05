/* Register — creates a local user. no emails were harmed. */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/Auth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <div>
        <span className="mono-label">new era loading…</span>
        <h2>make it official.</h2>
      </div>
      <p className="auth-sub">
        an account, stored entirely on your machine. the cloud cannot hurt you here.
      </p>
      {error && <div className="auth-error">⚠ {error}</div>}
      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span className="mono-label">name</span>
          <input
            className="input"
            placeholder="alex from it"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label className="field">
          <span className="mono-label">email</span>
          <input
            className="input"
            type="email"
            placeholder="alex@lockedin.fun"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="field">
          <span className="mono-label">password (6+ chars)</span>
          <input
            className="input"
            type="password"
            placeholder="something unhackable"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </label>
        <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
          <UserPlus size={15} strokeWidth={2.5} /> {busy ? 'cooking…' : 'create account'}
        </button>
      </form>
      <div className="auth-alt">
        already locked in? <Link to="/login">log in</Link>
      </div>
    </div>
  );
}
