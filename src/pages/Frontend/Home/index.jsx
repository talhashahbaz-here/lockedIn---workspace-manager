/* Frontend Home — the landing page. loud on purpose. */

import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

const FEATURES = [
  { icon: '🗂️', title: 'kanban that actually hits', body: 'drag cards between custom columns. reorder the columns themselves. your board, your rules.' },
  { icon: '📅', title: 'three views, one truth', body: 'board, list and calendar render the same tasks. switch whenever, we remember your favorite.' },
  { icon: '⌘', title: 'cmd+k everything', body: 'search tasks, projects and workspaces or run commands from one palette. keyboard gang rise up.' },
  { icon: '↩️', title: 'undo / redo energy', body: 'yeeted a task by accident? ctrl+z that. deleted a whole project? we got you with rollback toasts.' },
  { icon: '👥', title: 'roles with range', body: 'owner, admin, member, viewer. viewers can look but not touch — boundaries are healthy.' },
  { icon: '💬', title: 'comments + @mentions', body: 'argue about spacing directly on the task. mention your coworkers so they cannot escape.' },
  { icon: '🔔', title: 'notifications, no spam', body: 'assigned, mentioned, due soon — you choose which pings earn the right to reach you.' },
  { icon: '🪵', title: 'realtime activity log', body: 'every single action in your workspace is recorded in a live activity sidebar stream.' },
  { icon: '💾', title: 'offline? unbothered', body: 'everything is stored locally. export/import json, fake a sync, keep working in a bunker.' },
];

const STEPS = [
  { n: '01', title: 'sign into your accounts', body: 'log into owner, admin, member or viewer accounts. switch between multiple accounts anytime.' },
  { n: '02', title: 'spawn a workspace', body: 'create a space, invite the team, pick an emoji and a color that matches your aura.' },
  { n: '03', title: 'lock in', body: 'brain-dump tasks, drag them across the board, ship them, dunk on the stats page. repeat forever.' },
];

export default function FrontendHome() {
  return (
    <main>
      {/* hero */}
      <section className="hero">
        <div className="dot-grid" aria-hidden />
        <div className="hero-copy">
          <span className="sticker sticker-pink rotate-l">workspace manager ✳ est. right now</span>
          <h1 className="display-xl">
            stop doom-scrolling.
            <br />
            start <span className="accent-marker">shipping.</span>
          </h1>
          <p className="hero-sub">
            LockedIn is the project workspace for people with 47 tabs open and zero finished tasks.
            kanban, lists, calendars, comments — all the structure, none of the corporate.
          </p>
          <div className="hero-ctas">
            <Link to="/register" className="btn btn-accent">
              get locked in <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link to="/login" className="btn">
              i have an account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="num">70</span>
              <span className="mono-label">features</span>
            </div>
            <div className="hero-stat">
              <span className="num">0</span>
              <span className="mono-label">servers needed</span>
            </div>
            <div className="hero-stat">
              <span className="num">∞</span>
              <span className="mono-label">braincells (yours)</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden>
          <div className="panel hero-card-1">
            <div className="mono-label">icebox</div>
            <p className="text-sm" style={{ fontWeight: 700 }}>rethink the onboarding flow (again)</p>
          </div>
          <div className="panel hero-card-2">
            <div className="mono-label">cookin'</div>
            <p className="text-sm" style={{ fontWeight: 700 }}>ship the thing. any thing.</p>
            <span className="tag tag-accent">urgent</span>
          </div>
          <div className="panel hero-card-3">
            <div className="mono-label">shipped</div>
            <p className="text-sm" style={{ fontWeight: 700, textDecoration: 'line-through' }}>extinguish the fire</p>
            <span className="mono-label">✳ 3 tasks shipped today. woke behavior.</span>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="section">
        <div className="section-head">
          <div>
            <span className="mono-label">what is in the box</span>
            <h2 className="display-md">the roster.</h2>
          </div>
          <p>nine bangers out of seventy. hit “the roster” up top for the full nutrition label.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature-card">
              <span className="feature-icon" aria-hidden>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="section checker-bg">
        <div className="section-head">
          <div>
            <span className="mono-label">difficulty: you got this</span>
            <h2 className="display-md">three steps. that is it.</h2>
          </div>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <article key={s.n} className="step-card">
              <span className="step-num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="cta-band">
        <span className="sticker rotate-r">closing argument</span>
        <h2 className="display-lg">your tasks are not<br />going to ship themselves.</h2>
        <p style={{ maxWidth: 480, fontWeight: 600 }}>
          every second you spend not using LockedIn, a notification somewhere goes unread.
          think about it.
        </p>
        <Link to="/register" className="btn">
          fine, let's gooo <ArrowRight size={15} strokeWidth={2.5} />
        </Link>
        <span className="mono-label" style={{ color: '#141414' }}>
          <Check size={12} strokeWidth={3} style={{ display: 'inline' }} /> free forever ✳ no card ✳ no backend ✳ no cap
        </span>
      </section>
    </main>
  );
}
