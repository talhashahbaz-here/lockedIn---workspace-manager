/* Todos/All — project task & board view, global all tasks, and calendar view.
   Viewers can see project details and request to join.
   Admins can accept join requests to grant full task access. */

import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Lock, UserPlus, Clock, CheckCircle2, ShieldCheck, MessageSquare } from 'lucide-react';
import TaskWorkspace from './index';
import EmptyState from '@/components/EmptyState';
import ProjectMessages from '@/components/ProjectMessages';
import Avatar from '@/components/Avatar';
import { colorOf, uid } from '@/config/global';
import { joinRequestCreated, joinRequestApproved } from '@/store/slices/dataSlice';
import { toastPushed } from '@/store/slices/uiSlice';
import {
  selectVisibleProjectTasks, selectVisibleWorkspaceTasks, selectUsers,
  selectWorkspaceProjects, selectCurrentWorkspace, selectMyPermissions,
  selectUserCanAccessProjectTasks, selectProjectJoinRequests, selectActorId,
} from '@/store/selectors';

export default function All({ global = false, calendar = false }) {
  const dispatch = useDispatch();
  const { projectId } = useParams();
  const actorId = useSelector(selectActorId);
  const users = useSelector(selectUsers);
  const ws = useSelector(selectCurrentWorkspace);
  const projects = useSelector(selectWorkspaceProjects);
  const perms = useSelector(selectMyPermissions);
  
  const project = useSelector((s) =>
    projectId ? s.data.present.projects.find((p) => p.id === projectId) : null
  );
  
  const canAccessTasks = useSelector((s) =>
    projectId ? selectUserCanAccessProjectTasks(s, projectId) : false
  );
  
  const projectTasks = useSelector((s) =>
    projectId ? selectVisibleProjectTasks(s, projectId) : []
  );
  
  const joinRequests = useSelector((s) =>
    projectId ? selectProjectJoinRequests(s, projectId) : []
  );
  
  const globalTasks = useSelector(selectVisibleWorkspaceTasks);

  const wsMemberUsers = users.filter((u) => ws?.members.some((m) => m.userId === u.id));
  const projectMembers = users.filter((u) => project?.memberIds.includes(u.id));

  const unionColumns = (() => {
    const seen = new Map();
    projects.forEach((p) => p.columns.forEach((c) => seen.set(c.id, c)));
    return [...seen.values()];
  })();

  const handleRequestToJoin = () => {
    dispatch(
      joinRequestCreated({
        id: uid('jr'),
        projectId: project.id,
        userId: actorId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      })
    );
    dispatch(toastPushed({ text: `Join request sent to admins for "${project.name}"` }));
  };

  const handleApproveRequest = (req) => {
    dispatch(
      joinRequestApproved({
        requestId: req.id,
        projectId: project.id,
        userId: req.userId,
      })
    );
    const approvedUser = users.find((u) => u.id === req.userId);
    dispatch(
      toastPushed({
        text: `Approved ${approvedUser?.name ?? 'user'} to join "${project.name}"`,
      })
    );
  };

  /* ------------------------------- project mode ------------------------------ */
  if (projectId) {
    if (!project) {
      return (
        <div className="page">
          <EmptyState emoji="📦" title="Project not found" sub="This project may have been deleted or archived.">
            <Link to="/app/projects" className="btn btn-accent"><ArrowLeft size={13} /> back to projects</Link>
          </EmptyState>
        </div>
      );
    }

    const hex = colorOf(project.color).hex;
    const isOwnerOrAdmin = perms.role === 'owner' || perms.role === 'admin';
    const myPendingRequest = joinRequests.find((r) => r.userId === actorId && r.status === 'pending');
    const pendingAdminRequests = isOwnerOrAdmin ? joinRequests.filter((r) => r.status === 'pending') : [];

    return (
      <div className="page">
        <div className="project-hero">
          <div className="project-hero-strip" style={{ background: hex }} />
          <div style={{ flex: 1 }}>
            <div className="row-gap-6">
              <h1 style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}>{project.emoji} {project.name}</h1>
              {project.archived && <span className="tag tag-red">archived — read only</span>}
              {!canAccessTasks && <span className="tag tag-yellow">Viewer Mode</span>}
              {canAccessTasks && <span className="tag tag-blue">Member Access</span>}
            </div>
            <p className="project-hero-desc">{project.description || 'No description.'}</p>
            <div className="project-members-strip" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span className="mono-label">members ({projectMembers.length}):</span>
              <div className="avatar-group" style={{ display: 'inline-flex', gap: 4 }}>
                {projectMembers.map((m) => (
                  <span key={m.id} title={`${m.name} (${m.role})`}>
                    <Avatar user={m} size={20} />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link to="/app/projects" className="btn btn-sm"><ArrowLeft size={12} /> all projects</Link>
        </div>

        {/* Admin Pending Join Requests Banner */}
        {isOwnerOrAdmin && pendingAdminRequests.length > 0 && (
          <div className="admin-request-banner" style={{ background: 'var(--yellow-bg, #fff9db)', border: 'var(--bd)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
            <div className="row-between">
              <div>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} color="var(--yellow)" /> Pending Join Requests ({pendingAdminRequests.length})
                </strong>
                <span className="mono-label" style={{ display: 'block', marginTop: 2 }}>
                  Viewers requesting access to view tasks and collaborate on this project.
                </span>
              </div>
            </div>
            <div className="stack-8" style={{ marginTop: 10 }}>
              {pendingAdminRequests.map((req) => {
                const reqUser = users.find((u) => u.id === req.userId);
                return (
                  <div key={req.id} className="row-between" style={{ background: 'var(--surface)', padding: '6px 10px', borderRadius: 6, border: 'var(--bd)' }}>
                    <div className="row-gap-6">
                      <Avatar user={reqUser} size={22} />
                      <span><strong>{reqUser?.name}</strong> ({reqUser?.email})</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-accent"
                      onClick={() => handleApproveRequest(req)}
                    >
                      <CheckCircle2 size={13} strokeWidth={2.5} /> Accept & Add to Project
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Viewer with no task access */}
        {!canAccessTasks ? (
          <div className="stack-16">
            <div className="viewer-locked-card" style={{ background: 'var(--surface)', border: 'var(--bd)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
              <h3 style={{ fontSize: 20, margin: '0 0 8px' }}>You are currently a Viewer in this project</h3>
              <p className="auth-sub" style={{ maxWidth: 520, margin: '0 auto 16px' }}>
                Viewers can see the workspace and project overview, but tasks and Kanban boards are protected.
                Request to join this project so an administrator can accept you.
              </p>
              {myPendingRequest ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--yellow-bg, #fff9db)', border: 'var(--bd)', borderRadius: 6, color: 'var(--ink)' }}>
                  <Clock size={16} color="#e67700" />
                  <span><strong>Join request pending.</strong> An owner or admin can approve your request.</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-accent"
                  style={{ padding: '8px 20px', fontSize: 14 }}
                  onClick={handleRequestToJoin}
                >
                  <UserPlus size={15} strokeWidth={2.5} /> Request to Join Project
                </button>
              )}
            </div>

            <ProjectMessages project={project} members={projectMembers} />
          </div>
        ) : (
          <TaskWorkspace
            project={project}
            tasks={projectTasks}
            members={projectMembers}
            columns={project.columns}
            defaultView={project.defaultView ?? 'board'}
          />
        )}
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
              : `Tasks across projects you are a member of in ${ws?.name ?? 'this workspace'}.`}
          </p>
        </div>
        {!isAdmin && (
          <span className="tag tag-yellow" style={{ display: 'inline-flex', gap: 6 }}>
            <Lock size={11} /> showing tasks from projects you have joined
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
