/* Todos/All — the project task page. also handles the global "all tasks"
   and workspace calendar modes via props from the router. */

import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import TaskWorkspace from './index';
import EmptyState from '@/components/EmptyState';
import { colorOf } from '@/config/global';
import {
  selectVisibleProjectTasks, selectVisibleWorkspaceTasks, selectUsers,
  selectWorkspaceProjects, selectCurrentWorkspace, selectMyPermissions,
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
    if (!project) {
      return (
        <div className="page">
          <EmptyState emoji="🫥" title="project not found" sub="it may have been deleted. projects have feelings too.">
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
            <p className="project-hero-desc">{project.description || 'no description. it prefers to remain an enigma.'}</p>
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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{calendar ? 'calendar' : 'all tasks'}</h1>
          <p className="page-sub">
            {calendar
              ? 'every deadline in the workspace, on one grid.'
              : `every task across ${projects.length} project(s) in ${ws?.name ?? 'the workspace'}.`}
          </p>
        </div>
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
