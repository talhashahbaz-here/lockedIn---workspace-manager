/* Frontend "Todos" — renamed for LockedIn: the full 14-domain / 70-feature
   nutrition label. every feature the capstone asked for, receipts attached. */

const DOMAINS = [
  { emoji: '🔑', name: 'auth & user', items: ['login/signup with mock credential check', 'session persisted in localStorage', 'editable profile (avatar, name, email)', 'switch between mock profiles', 'logout clears session'] },
  { emoji: '🏢', name: 'workspaces', items: ['create / rename / delete workspace', 'switch between multiple workspaces', 'workspace settings (name, emoji, color, default view)', 'member list per workspace', 'invite members (adds a mock user)'] },
  { emoji: '📦', name: 'projects', items: ['create / rename / archive / delete', 'color + emoji tagging', 'description field', 'per-project member assignment', 'project templates with preset tasks'] },
  { emoji: '✅', name: 'tasks & subtasks', items: ['full crud on tasks', 'checklist subtasks', 'rich fields: status, priority, due, assignee, labels', 'task detail modal', 'file attachments (base64)', 'convert subtask ⇄ task', 'duplicate task', 'bulk actions'] },
  { emoji: '🎛️', name: 'views', items: ['kanban with drag & drop', 'custom reorderable columns', 'sortable list/table view', 'calendar by due date', 'view remembered per project', 'group-by in list view'] },
  { emoji: '🔎', name: 'filter, search, sort', items: ['global search (cmd+k)', 'filter by assignee, label, priority, status, due range', 'sort by due, priority, created, alphabetical', 'saved filter presets'] },
  { emoji: '🔐', name: 'roles & permissions', items: ['owner / admin / member / viewer', 'permission-gated ui', 'role assignment per member', 'access-denied states'] },
  { emoji: '📜', name: 'activity log', items: ['per-task feed', 'per-project feed', 'timestamped entries with acting user', 'filterable by user and action type'] },
  { emoji: '💬', name: 'comments & collab', items: ['comment threads per task', '@mention autocomplete', 'edit/delete own comments', 'simulated live updates'] },
  { emoji: '↩️', name: 'undo / redo & optimistic ux', items: ['undo/redo stack for edits, moves, deletes', 'optimistic updates with fake latency', 'rollback on simulated failure', 'toasts with inline undo'] },
  { emoji: '🔔', name: 'notifications', items: ['bell with unread count', 'assigned / mentioned / due-soon triggers', 'mark read + mark all read', 'per-event-type preferences'] },
  { emoji: '📴', name: 'persistence & offline', items: ['full state in IndexedDB/localStorage', 'rehydrate on reload', 'offline indicator', 'manual fake sync', 'export workspace json', 'import json with validation', 'reset everything button'] },
  { emoji: '🧰', name: 'ui/ux utilities', items: ['command palette (cmd+k)', 'keyboard shortcuts', 'dark/light theme (persisted)', 'responsive with mobile drawer nav', 'loading skeletons', 'empty states', 'confirmation dialogs'] },
  { emoji: '⚙️', name: 'settings', items: ['app-wide preferences', 'workspace settings page', 'danger zone (delete workspace/project)'] },
];

export default function FrontendTodos() {
  const total = DOMAINS.reduce((n, d) => n + d.items.length, 0);
  return (
    <main>
      <section className="features-hero">
        <span className="sticker rotate-l">receipts 🧾</span>
        <h1 className="display-lg">the roster.</h1>
        <p className="muted" style={{ maxWidth: 620 }}>
          every single thing LockedIn can do, grouped into {DOMAINS.length} domains and {total}{' '}
          features. no fluff, no “coming soon”. it is all in the app, right now, offline-friendly.
        </p>
      </section>
      <section className="section">
        <div className="domain-grid">
          {DOMAINS.map((d) => (
            <article key={d.name} className="domain-card">
              <div className="domain-head">
                <span style={{ fontSize: 22 }} aria-hidden>{d.emoji}</span>
                <h3 style={{ fontSize: 17 }}>{d.name}</h3>
                <span className="domain-count">{d.items.length}</span>
              </div>
              <ul>
                {d.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="cta-band">
        <h2 className="display-md">convinced? obviously.</h2>
        <a href="/register" className="btn">get locked in</a>
      </section>
    </main>
  );
}
