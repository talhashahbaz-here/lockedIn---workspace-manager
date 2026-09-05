/* ForgotPassword — simulated reset flow. no emails are actually sent. */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, Send } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="auth-card">
      <div>
        <span className="mono-label">password reset</span>
        <h2>reset your password.</h2>
      </div>
      <p className="auth-sub">
        Enter your email and we will send a reset link. (This is a frontend-only
        demo, so nothing is actually sent.)
      </p>

      {sent ? (
        <div className="auth-forgot-note">
          <MailCheck size={15} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: -3 }} />{' '}
          Reset link “sent” to {email || 'your email'}. Every mock account uses the password <b>frfr1234</b>.
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span className="mono-label">email</span>
            <input
              className="input"
              type="email"
              placeholder="you@lockedin.fun"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn-accent btn-block">
            <Send size={14} strokeWidth={2.5} /> send reset link
          </button>
        </form>
      )}

      <div className="auth-alt">
        remembered it after all? <Link to="/login">back to login</Link>
      </div>
    </div>
  );
}
