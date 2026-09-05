/* ==========================================================================
   selectors — every read the UI needs, memoized so the kanban stays buttery.
   ========================================================================== */

import { createSelector } from '@reduxjs/toolkit';
import { can as roleCan, isOverdue } from '@/config/global';

export const selectData = (state) => state.data.present;
export const selectUsers = (state) => state.data.present.users;
export const selectWorkspaces = (state) => state.data.present.workspaces;
export const selectProjects = (state) => state.data.present.projects;
export const selectTasks = (state) => state.data.present.tasks;
export const selectComments = (state) => state.data.present.comments;
export const selectActivity = (state) => state.logs.activity;
export const selectNotifications = (state) => state.logs.notifications;
export const selectUI = (state) => state.ui;

export const selectActorId = (state) => state.ui.actorId;
export const selectActor = createSelector(selectActorId, selectUsers, (id, users) =>
  users.find((u) => u.id === id) ?? null
);

export const selectCurrentWorkspaceId = (state) => state.ui.currentWorkspaceId;
export const selectCurrentWorkspace = createSelector(
  selectWorkspaces, selectCurrentWorkspaceId, (ws, id) => ws.find((w) => w.id === id) ?? null
);

export const selectWorkspaceProjects = createSelector(
  [selectProjects, selectCurrentWorkspaceId], (projects, wsId) =>
    projects.filter((p) => p.workspaceId === wsId)
);
export const selectActiveWorkspaceProjects = createSelector(
  [selectWorkspaceProjects], (projects) => projects.filter((p) => !p.archived)
);

export const selectProjectById = (state, id) =>
  state.data.present.projects.find((p) => p.id === id) ?? null;
export const selectTaskById = (state, id) =>
  state.data.present.tasks.find((t) => t.id === id) ?? null;

/* ------------------------------- permissions ------------------------------ */

export const selectMyRole = createSelector(
  [selectCurrentWorkspace, selectActorId], (ws, actorId) =>
    ws?.members.find((m) => m.userId === actorId)?.role ?? null
);
export const selectMyPermissions = createSelector([selectMyRole], (role) => ({
  role,
  can: (action) => roleCan(role, action),
}));

/* --------------------------------- tasks ---------------------------------- */

export const selectProjectTasks = createSelector(
  [selectTasks, (state, projectId) => projectId],
  (tasks, projectId) =>
    tasks
      .filter((t) => t.projectId === projectId)
      .slice()
      .sort((a, b) => a.order - b.order)
);

export const selectWorkspaceTasks = createSelector(
  [selectTasks, selectWorkspaceProjects],
  (tasks, projects) => {
    const ids = new Set(projects.map((p) => p.id));
    return tasks.filter((t) => ids.has(t.projectId));
  }
);

const matchesFilters = (t, f) => {
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = `${t.title} ${t.description ?? ''} ${t.labels.join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.assigneeIds.length && !f.assigneeIds.includes(t.assigneeId ?? 'unassigned')) return false;
  if (f.priorities.length && !f.priorities.includes(t.priority)) return false;
  if (f.statuses.length && !f.statuses.includes(t.columnId)) return false;
  if (f.labels.length && !f.labels.some((l) => t.labels.includes(l))) return false;
  if (f.dueFrom || f.dueTo) {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate).setHours(0, 0, 0, 0);
    if (f.dueFrom && d < new Date(f.dueFrom).setHours(0, 0, 0, 0)) return false;
    if (f.dueTo && d > new Date(f.dueTo).setHours(23, 59, 59, 999)) return false;
  }
  return true;
};

const PRIORITY_RANK = { drop: 0, highkey: 1, mid: 2, lowkey: 3 };

export const applySort = (tasks, sort) => {
  const dir = sort.dir === 'desc' ? -1 : 1;
  const list = tasks.slice();
  switch (sort.by) {
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title) * dir);
    case 'priority':
      return list.sort((a, b) => (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir);
    case 'created':
      return list.sort((a, b) => (new Date(a.createdAt) - new Date(b.createdAt)) * dir);
    case 'assignee': {
      return list.sort((a, b) => String(a.assigneeId ?? 'zz').localeCompare(String(b.assigneeId ?? 'zz')) * dir);
    }
    case 'due':
    default:
      return list.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return (new Date(a.dueDate) - new Date(b.dueDate)) * dir;
      });
  }
};

// tasks of a project, filtered + sorted by current ui state
export const selectVisibleProjectTasks = createSelector(
  [selectProjectTasks, (state) => state.ui.filters, (state) => state.ui.sort],
  (tasks, filters, sort) => applySort(tasks.filter((t) => matchesFilters(t, filters)), sort)
);

export const selectVisibleWorkspaceTasks = createSelector(
  [selectWorkspaceTasks, (state) => state.ui.filters, (state) => state.ui.sort],
  (tasks, filters, sort) => applySort(tasks.filter((t) => matchesFilters(t, filters)), sort)
);

export const groupTasks = (tasks, groupBy, users, project) => {
  if (groupBy === 'none') return [{ key: 'all', label: null, tasks }];
  const groups = new Map();
  for (const t of tasks) {
    let key;
    switch (groupBy) {
      case 'assignee':
        key = t.assigneeId ?? 'unassigned';
        break;
      case 'status':
        key = t.columnId;
        break;
      case 'priority':
        key = t.priority;
        break;
      case 'label': {
        const labels = t.labels.length ? t.labels : ['no label'];
        labels.forEach((l) => {
          if (!groups.has(l)) groups.set(l, []);
          groups.get(l).push(t);
        });
        continue;
      }
      default:
        key = 'all';
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  let labeler = (k) => k;
  if (groupBy === 'assignee')
    labeler = (k) => (k === 'unassigned' ? 'unassigned' : users.find((u) => u.id === k)?.name ?? k);
  if (groupBy === 'status')
    labeler = (k) => project?.columns.find((c) => c.id === k)?.title ?? k;
  return [...groups.entries()].map(([key, tasks]) => ({ key, label: labeler(key), tasks }));
};

/* ------------------------------ notifications ------------------------------ */

export const selectMyNotifications = createSelector(
  [selectNotifications, selectActorId],
  (notifs, userId) => notifs.filter((n) => n.userId === userId)
);
export const selectUnreadCount = createSelector(
  [selectMyNotifications], (notifs) => notifs.filter((n) => !n.read).length
);

/* --------------------------------- activity -------------------------------- */

export const selectTaskActivity = (state, taskId) =>
  state.logs.activity.filter((a) => a.taskId === taskId);
export const selectProjectActivity = createSelector(
  [selectActivity, (state, projectId) => projectId],
  (activity, projectId) => activity.filter((a) => a.projectId === projectId)
);

/* ---------------------------------- search --------------------------------- */

export const globalSearch = (state, q) => {
  if (!q || q.trim().length < 1) return { tasks: [], projects: [], workspaces: [] };
  const query = q.toLowerCase();
  const { tasks, projects, workspaces } = state.data.present;
  return {
    workspaces: workspaces.filter((w) => w.name.toLowerCase().includes(query)).slice(0, 4),
    projects: projects.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 6),
    tasks: tasks
      .filter((t) => t.title.toLowerCase().includes(query))
      .slice(0, 8),
  };
};

/* -------------------------------- dashboard -------------------------------- */

export const selectMyTasks = createSelector(
  [selectWorkspaceTasks, selectActorId],
  (tasks, userId) => tasks.filter((t) => t.assigneeId === userId && !t.completedAt)
);

export const selectOverdueTasks = createSelector(
  [selectWorkspaceTasks], (tasks) => tasks.filter((t) => !t.completedAt && isOverdue(t.dueDate))
);

export const selectWorkspaceStats = createSelector(
  [selectWorkspaceTasks, selectWorkspaceProjects, selectCurrentWorkspace],
  (tasks, projects, ws) => ({
    totalTasks: tasks.length,
    doneTasks: tasks.filter((t) => t.completedAt).length,
    activeTasks: tasks.filter((t) => !t.completedAt).length,
    overdue: tasks.filter((t) => !t.completedAt && isOverdue(t.dueDate)).length,
    projects: projects.filter((p) => !p.archived).length,
    members: ws?.members.length ?? 0,
  })
);

export const selectProjectComments = createSelector(
  [selectComments, (state, projectId) => projectId],
  (comments, projectId) => comments.filter((c) => c.projectId === projectId)
);
