/* Home — the dashboard. stats, my tasks, workspace activity, quick nav. */

import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, ListTodo, FolderKanban, Users as UsersIcon, ArrowRight, Radio } from 'lucide-react';
import Hero from './Hero';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { timeAgo, priorityOf, isOverdue, friendlyDate } from '@/config/global';
import {
  selectWorkspaceStats, selectMyTasks, selectActivity, selectUsers,
  selectActiveWorkspaceProjects, selectCurrentWorkspace,
} from '@/store/selectors';
import { detailTaskOpened } from '@/store/slices/uiSlice';

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stats = useSelector(selectWorkspaceStats);
  const myTasks = useSelector(selectMyTasks);
  const users = useSelector(selectUsers);
  const activity = useSelector(selectActivity).slice(0, 12);
  const projects = useSelector(selectActiveWorkspaceProjects);
  const ws = useSelector(selectCurrentWorkspace);
  const wsTasks = useSelector((s) => {
    // tasks of this workspace, most relevant first
    const ids = new Set(s.data.present.projects.filter((p) => p.workspaceId === s.ui.currentWorkspaceId).map((p) => p.id));
    return s.data.present.tasks.filter((t) => ids.has(t.projectId));
  });

  const hotTasks = wsTasks
    .filter((t) => !t.completedAt)
    .sort((a, b) => {
      const overdueA = isOverdue(a.dueDate) ? -1 : 0;
      const overdueB = isOverdue(b.dueDate) ? -1 : 0;
      return overdueA - overdueB || new Date(a.dueDate ?? '2999') - new Date(b.dueDate ?? '2999');
    })
    .slice(0, 6);

  return (
    <div className="page">
      <Hero />

      <div className="stat-grid">
        <div className="stat-card stat-accent">
          <span className="stat-num">{stats.activeTasks}</span>
          <span className="mono-label">tasks in the fire</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.doneTasks}</span>
          <span className="mono-label">shipped 🚀</span>
        </div>
        <div className="stat-card stat-red">
          <span className="stat-num">{stats.overdue}</span>
          <span className="mono-label">overdue (cooked)</span>
        </div>
        <div className="stat-card stat-pink">
          <span className="stat-num">{stats.projects}</span>
          <span className="mono-label">active projects</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{stats.members}</span>
          <span className="mono-label">members</span>
        </div>
      </div>

      <div className="home-grid">
        <div className="stack-16">
          {/* my tasks */}
          <section className="home-panel">
            <div className="home-panel-head">
              <h3>📋 on your plate</h3>
              <Link to="/app/tasks" className="btn btn-sm">all tasks <ArrowRight size={12} /></Link>
            </div>
            {myTasks.length === 0 ? (
              <EmptyState compact emoji="🧘" title="inbox zero energy" sub="nothing assigned to you. either you are very efficient or very avoidant.">
                <button type="button" className="btn btn-sm btn-accent" onClick={() => navigate('/app/projects')}>poke around projects</button>
              </EmptyState>
            ) : (
              <div className="stack-8">
                {myTasks.slice(0, 7).map((t) => {
                  const pri = priorityOf(t.priority);
                  const overdue = isOverdue(t.dueDate);
                  return (
                    <button key={t.id} type="button" className="mini-task" onClick={() => dispatch(detailTaskOpened(t.id))}>
                      <span style={{ width: 8, height: 22, background: pri.color, border: '2px solid var(--ink)', flexShrink: 0 }} />
                      <span className="mini-title">{t.title}</span>
                      {t.dueDate && <span className={`due-chip ${overdue ? 'overdue' : ''}`}>{friendlyDate(t.dueDate)}</span>}
                      <Avatar user={users.find((u) => u.id === t.createdById)} size={20} />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* hottest in the workspace */}
          <section className="home-panel">
            <div className="home-panel-head">
              <h3>🔥 hottest in {ws?.name ?? 'the ws'}</h3>
              <span className="mono-label">most urgent, unshipped</span>
            </div>
            {hotTasks.length === 0 ? (
              <EmptyState compact emoji="🏝️" title="nothing urgent" sub="no open tasks with deadlines. suspiciously peaceful." />
            ) : (
              <div className="stack-8">
                {hotTasks.map((t) => {
                  const assignee = users.find((u) => u.id === t.assigneeId);
                  const overdue = isOverdue(t.dueDate);
                  return (
                    <button key={t.id} type="button" className="mini-task" onClick={() => dispatch(detailTaskOpened(t.id))}>
                      {overdue ? <Flame size={15} strokeWidth={2.5} color="#141414" /> : <ListTodo size={15} strokeWidth={2.5} />}
                      <span className="mini-title">{t.title}</span>
                      {t.dueDate && <span className={`due-chip ${overdue ? 'overdue' : ''}`}>{friendlyDate(t.dueDate)}</span>}
                      {assignee && <Avatar user={assignee} size={20} title={assignee.name} />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="stack-16">
          {/* projects */}
          <section className="home-panel">
            <div className="home-panel-head">
              <h3>🗂️ projects</h3>
              <Link to="/app/projects" className="btn btn-sm"><FolderKanban size={12} /> all</Link>
            </div>
            <div className="stack-8">
              {projects.slice(0, 5).map((p) => (
                <button key={p.id} type="button" className="mini-task" onClick={() => navigate(`/app/project/${p.id}`)}>
                  <span style={{ fontSize: 16 }}>{p.emoji}</span>
                  <span className="mini-title">{p.name}</span>
                  <span className="board-col-count">{p.columns.length} lanes</span>
                </button>
              ))}
              {projects.length === 0 && <span className="mono-label">no projects yet. go make one.</span>}
            </div>
          </section>

          {/* activity */}
          <section className="home-panel">
            <div className="home-panel-head">
              <h3>📡 live-ish feed</h3>
              <Link to="/app/activity" className="btn btn-sm"><Radio size={12} /> full log</Link>
            </div>
            <div className="stack-8">
              {activity.map((a) => {
                const actor = users.find((u) => u.id === a.actorId);
                return (
                  <div key={a.id} className="row-gap-6" style={{ alignItems: 'flex-start', fontSize: 13 }}>
                    <Avatar user={actor} size={22} />
                    <span style={{ flex: 1 }}>
                      <b>{actor?.name.split(' ')[0] ?? 'someone'}</b> {a.text}
                    </span>
                    <span className="mono-label" style={{ whiteSpace: 'nowrap' }}>{timeAgo(a.ts)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* members mini */}
          <section className="home-panel">
            <div className="home-panel-head">
              <h3>👥 the squad</h3>
              <Link to="/app/members" className="btn btn-sm"><UsersIcon size={12} /> manage</Link>
            </div>
            <div className="project-avatars" style={{ padding: '4px 0 8px' }}>
              {(ws?.members ?? []).map((m) => {
                const u = users.find((x) => x.id === m.userId);
                return <Avatar key={m.userId} user={u} size={34} ring title={`${u?.name} — ${m.role}`} />;
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
