/* Auth layout — split screen: poster on the left, form on the right. */

import { Link, Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Auth() {
  return (
    <div className="auth-shell">
      <aside className="auth-poster">
        <div className="dot-grid" aria-hidden />
        <Link to="/" className="auth-poster-brand">
          <span className="brand-bolt">
            <Zap size={18} strokeWidth={2.5} color="#141414" />
          </span>
          LockedIn
        </Link>
        <div className="auth-poster-copy">
          <span className="sticker sticker-pink rotate-l">the workspace that respects you</span>
          <h1 className="display-lg">
            your tasks,
            <br />
            <span className="pink-marker">handled.</span>
          </h1>
          <p className="muted">
            kanban, lists, calendars, comments — plus fake coworkers that actually
            pretend to work. log in and feel organized instantly.
          </p>
          <div className="auth-poster-badges">
            <span className="tag tag-accent">offline-first</span>
            <span className="tag tag-blue">cmd+k</span>
            <span className="tag tag-pink">dark mode</span>
            <span className="tag tag-yellow">undo everything</span>
          </div>
        </div>
        <span className="auth-poster-foot">no backend ✳ no tracking ✳ no cap</span>
      </aside>

      <main className="auth-panel">
        <Outlet />
      </main>
    </div>
  );
}
