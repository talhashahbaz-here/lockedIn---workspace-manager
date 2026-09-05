/* ForgotPassword — we pretend to send an email. theater, but honest theater. */

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
        <span className="mono-label">password amnesia</span>
        <h2>forgot it? valid.</h2>
      </div>
      <p className="auth-sub">
        happens to the best of us. drop your email and we will absolutely,
        definitely, 100% send a reset link. (we will not. there is no server. but you feel seen, right?)
      </p>

      {sent ? (
        <div className="auth-forgot-note">
          <MailCheck size={15} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: -3 }} />{' '}
          reset link “sent” to {email || 'your email'}. check your inbox in an alternate universe
          where this app has a backend. psst: every mock account uses <b>frfr1234</b>.
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
            <Send size={14} strokeWidth={2.5} /> pretend to send it
          </button>
        </form>
      )}

      <div className="auth-alt">
        remembered it after all? <Link to="/login">back to login</Link>
      </div>
    </div>
  );
}
