/* Todos/All — the project task page. also handles the global "all tasks"
   and workspace calendar modes via props from the router. visibility:
   owners/admins see everything; members/viewers get only projects they
   are added to and, in the aggregated views, only their own tasks. */

import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Lock } from 'lucide-react';
import TaskWorkspace from './index';
import EmptyState from '@/components/EmptyState';
import { colorOf } from '@/config/global';
import {
  selectVisibleProjectTasks, selectVisibleWorkspaceTasks, selectUsers,
  selectWorkspaceProjects, selectCurrentWorkspace, selectMyPermissions, selectProjectIsVisible,
} from '@/store/selectors';

export default function All({ global = false, calendar = false }) {
  const { projectId } = useParams();
  const users = useSelector(selectUsers);
  const ws = useSelector(selectCurrentWorkspace);
  const projects = useSelector(selectWorkspaceProjects);
  const perms = useSelector(selectMyPermissions);
  const project = useSelector((s) =>
    projectId ? s.data.present.projects.find((p) => p.id === projectId) : null
  );
  const projectVisible = useSelector((s) =>
    projectId ? selectProjectIsVisible(s, projectId) : false
  );
  const projectTasks = useSelector((s) =>
    projectId ? selectVisibleProjectTasks(s, projectId) : []
  );
  const globalTasks = useSelector(selectVisibleWorkspaceTasks);

  const wsMemberUsers = users.filter((u) => ws?.members.some((m) => m.userId === u.id));

  const unionColumns = (() => {
    const seen = new Map();
    projects.forEach((p) => p.columns.forEach((c) => seen.set(c.id, c)));
    return [...seen.values()];
  })();

  /* ------------------------------- project mode ------------------------------ */
  if (projectId) {
    if (!project || !projectVisible) {
      return (
        <div className="page">
          <EmptyState emoji="🔒" title="No access to this project" sub="You can only open projects you have been added to. Ask an owner or admin to add you if you need access.">
            <Link to="/app/projects" className="btn btn-accent"><ArrowLeft size={13} /> back to projects</Link>
          </EmptyState>
        </div>
      );
    }
    const hex = colorOf(project.color).hex;
    return (
      <div className="page">
        <div className="project-hero">
          <div className="project-hero-strip" style={{ background: hex }} />
          <div style={{ flex: 1 }}>
            <div className="row-gap-6">
              <h1 style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}>{project.emoji} {project.name}</h1>
              {project.archived && <span className="tag tag-red">archived — read only</span>}
            </div>
            <p className="project-hero-desc">{project.description || 'No description.'}</p>
          </div>
          <Link to="/app/projects" className="btn btn-sm"><ArrowLeft size={12} /> all projects</Link>
        </div>
        <TaskWorkspace
          project={project}
          tasks={projectTasks}
          members={users.filter((u) => project.memberIds.includes(u.id))}
          columns={project.columns}
          defaultView={project.defaultView ?? 'board'}
        />
      </div>
    );
  }

  /* ------------------------- global tasks / calendar mode -------------------- */
  const tasks = calendar ? globalTasks.filter((t) => t.dueDate) : globalTasks;
  const isAdmin = perms.role === 'owner' || perms.role === 'admin';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{calendar ? 'calendar' : 'all tasks'}</h1>
          <p className="page-sub">
            {isAdmin
              ? `All tasks across ${projects.length} project(s) in ${ws?.name ?? 'this workspace'}.`
              : `Your assigned tasks across ${projects.length} project(s) you are part of.`}
          </p>
        </div>
        {!isAdmin && (
          <span className="tag tag-yellow" style={{ display: 'inline-flex', gap: 6 }}>
            <Lock size={11} /> showing your tasks only — owners and admins see all
          </span>
        )}
      </div>
      <TaskWorkspace
        project={null}
        tasks={tasks}
        members={wsMemberUsers}
        columns={unionColumns}
        defaultView={calendar ? 'calendar' : 'list'}
      />
    </div>
  );
}
