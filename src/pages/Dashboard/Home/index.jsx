/* Home — calm dashboard. slim hero, three stats, your tasks, live feed.
   new workspaces also get a getting-started checklist. nothing else. */

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import Hero from './Hero';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { isOverdue, friendlyDate } from '@/config/global';
import { lsGet, lsSet } from '@/config/persistence';
import {
  selectWorkspaceStats, selectMyTasks, selectActivity, selectUsers,
  selectActiveWorkspaceProjects,
} from '@/store/selectors';
import { detailTaskOpened, toastPushed } from '@/store/slices/uiSlice';

const DISMISS_KEY = 'lockedin-checklist-dismissed';

/* ------------------------- getting started checklist ------------------------ */

function GettingStarted({ projects, tasks, activeTasks }) {
  const dispatch = useDispatch();
  const [dismissed, setDismissed] = useState(() => Boolean(lsGet(DISMISS_KEY)));

  const steps = useMemo(
    () => [
      { id: 'project', label: 'Create your first project', done: projects.length > 0, to: '/app/projects' },
      { id: 'task', label: 'add a task to it', done: tasks.length > 0, to: '/app/tasks' },
      { id: 'ship', label: 'Complete a task', done: tasks.length > tasks.filter((t) => !t.completedAt).length, to: '/app/tasks' },
    ],
    [projects.length, tasks]
  );
  void activeTasks;

  const remaining = steps.filter((s) => !s.done).length;
  if (dismissed || remaining === 0) return null;

  return (
    <section className="home-panel checklist-card">
      <div className="home-panel-head">
        <h3>🧭 start here</h3>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          title="hide checklist"
          onClick={() => {
            setDismissed(true);
            lsSet(DISMISS_KEY, true);
            dispatch(toastPushed({ text: 'Checklist hidden' }));
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
      <ol className="checklist">
        {steps.map((s) => (
          <li key={s.id} className={s.done ? 'done' : ''}>
            <span className="checklist-check">{s.done ? <Check size={13} strokeWidth={3} /> : ''}</span>
            {s.done ? (
              <span className="checklist-label done">{s.label}</span>
            ) : (
              <Link to={s.to} className="checklist-label">{s.label} →</Link>
            )}
          </li>
        ))}
      </ol>
      <span className="mono-label">{remaining} step(s) left. You are all set.</span>
    </section>
  );
}

/* ---------------------------------- page ----------------------------------- */

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stats = useSelector(selectWorkspaceStats);
  const myTasks = useSelector(selectMyTasks);
  const users = useSelector(selectUsers);
  const activity = useSelector(selectActivity);
  const projects = useSelector(selectActiveWorkspaceProjects);
  const wsTasks = useSelector((s) => {
    const ids = new Set(s.data.present.projects.filter((p) => p.workspaceId === s.ui.currentWorkspaceId).map((p) => p.id));
    return s.data.present.tasks.filter((t) => ids.has(t.projectId));
  });

  const feed = useMemo(() => {
    // activity entries are tagged with workspaceId at write time; the store
    // already scopes reads, so a light slice is enough
    return activity.slice(0, 8);
  }, [activity]);

  return (
    <div className="page">
      <Hero />

      <GettingStarted projects={projects} tasks={wsTasks} activeTasks={stats.activeTasks} />

      <div className="stat-grid stats-3">
        <div className="stat-card stat-accent">
          <span className="stat-num">{stats.activeTasks}</span>
          <span className="mono-label">Active tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.doneTasks}</span>
          <span className="mono-label">shipped 🚀</span>
        </div>
        <div className="stat-card stat-red">
          <span className="stat-num">{stats.overdue}</span>
          <span className="mono-label">Overdue</span>
        </div>
      </div>

      <div className="home-grid">
        {/* my tasks */}
        <section className="home-panel">
          <div className="home-panel-head">
            <h3>My tasks</h3>
            <Link to="/app/tasks" className="btn btn-sm">all tasks</Link>
          </div>
          {myTasks.length === 0 ? (
            <EmptyState compact emoji="🧘" title="nothing assigned to you" sub="Nothing is assigned to you right now.">
              <button type="button" className="btn btn-sm btn-accent" onClick={() => navigate('/app/tasks')}>browse tasks</button>
            </EmptyState>
          ) : (
            <div className="stack-8">
              {myTasks.slice(0, 5).map((t) => {
                const overdue = isOverdue(t.dueDate);
                return (
                  <button key={t.id} type="button" className="mini-task" onClick={() => dispatch(detailTaskOpened(t.id))}>
                    <span className={`due-chip ${overdue ? 'overdue' : ''}`}>{t.dueDate ? friendlyDate(t.dueDate) : 'no date'}</span>
                    <span className="mini-title">{t.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* live feed */}
        <section className="home-panel">
          <div className="home-panel-head">
            <h3>📡 recent activity</h3>
            <Link to="/app/activity" className="btn btn-sm">full log</Link>
          </div>
          <div className="stack-8">
            {feed.map((a) => {
              const actor = users.find((u) => u.id === a.actorId);
              return (
                <div key={a.id} className="row-gap-6" style={{ alignItems: 'flex-start', fontSize: 13 }}>
                  <Avatar user={actor} size={22} />
                  <span style={{ flex: 1 }}>
                    <b>{actor?.name.split(' ')[0] ?? 'someone'}</b> {a.text}
                  </span>
                </div>
              );
            })}
            {feed.length === 0 && <span className="mono-label">quiet in here. for now.</span>}
          </div>
        </section>
      </div>
    </div>
  );
}
