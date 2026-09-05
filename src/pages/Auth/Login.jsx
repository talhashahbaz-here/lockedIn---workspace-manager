/* Login — fake credential check against local mock users. */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/context/Auth';
import { useSelector } from 'react-redux';
import { selectUsers } from '@/store/selectors';
import { MOCK_PASSWORD } from '@/config/mockData';
import Avatar from '@/components/Avatar';

export default function Login() {
  const { login, switchUser } = useAuth();
  const users = useSelector(selectUsers);
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
    <>
      <div className="auth-card">
        <div>
          <span className="mono-label">welcome back</span>
          <h2>you know the drill.</h2>
        </div>
        <p className="auth-sub">
          email + password. if it matches a local mock account, you are in. simple.
        </p>
        {error && <div className="auth-error">⚠ {error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span className="mono-label">email</span>
            <input
              className="input"
              type="email"
              placeholder="you@lockedin.fun"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
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
            <LogIn size={15} strokeWidth={2.5} /> {busy ? 'checking…' : 'let me in'}
          </button>
        </form>
        <div className="auth-alt">
          forgot your password? <Link to="/forgot-password">tragic, click here</Link>
        </div>
        <div className="auth-alt">
          new here? <Link to="/register">make it official</Link>
        </div>
      </div>

      <div className="auth-quick">
        <div className="auth-quick-card">
          <span className="mono-label">lazy? speedrun it — hop in as a mock user</span>
          <div className="quick-users">
            {users.slice(0, 6).map((u) => (
              <button
                key={u.id}
                type="button"
                className="quick-user"
                onClick={() => {
                  switchUser(u.id);
                  navigate('/app');
                }}
                title={u.bio}
              >
                <Avatar user={u} size={22} />
                {u.name.split(' ')[0]}
              </button>
            ))}
          </div>
          <span className="mono-label">password for all mock accounts: {MOCK_PASSWORD}</span>
        </div>
      </div>
    </>
  );
}
