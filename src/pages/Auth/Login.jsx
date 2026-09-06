/* Login — credential check against local mock accounts.
   All mock users and passwords can be found in passwords.txt in the project root. */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/Auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from ?? '/app';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <div>
        <span className="mono-label">sign in</span>
        <h2>Log in to LockedIn</h2>
      </div>
      <p className="auth-sub">
        Enter credentials for your account. Passwords for owner, admin, member, and viewer are stored in <code>passwords.txt</code>.
      </p>
      {error && <div className="auth-error">⚠ {error}</div>}
      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span className="mono-label">email</span>
          <input
            className="input"
            type="email"
            placeholder="e.g. owner@lockedin.fun"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span className="mono-label">password</span>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <button type="submit" className="btn btn-accent btn-block" disabled={busy}>
          <LogIn size={15} strokeWidth={2.5} /> {busy ? 'verifying…' : 'Log in'}
        </button>
      </form>
      <div className="auth-alt" style={{ marginTop: 16 }}>
        <KeyRound size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
        Mock credentials: check <strong>passwords.txt</strong> in root directory.
      </div>
      <div className="auth-alt">
        New here? <Link to="/register">Create an account</Link>
      </div>
    </div>
  );
}
