/* ==========================================================================
   dataSlice — the undoable heart of the app.
   users, workspaces, projects, tasks, comments. every action type in
   UNDOABLE_TYPES is time-travel enabled (see store/undo.js).
   ========================================================================== */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fakeRequest } from '@/config/persistence';
import { buildSeedState } from '@/config/mockData';

/* actions listed here push onto the undo stack (meta.undoable is set by
   the marking middleware in store/index.js) */
export const UNDOABLE_TYPES = new Set([
  'data/taskAdded', 'data/taskPatched', 'data/taskDeleted', 'data/taskDuplicated',
  'data/subtaskAdded', 'data/subtaskDeleted', 'data/subtaskToggled', 'data/subtaskRenamed',
  'data/subtaskPromoted', 'data/taskDemoted',
  'data/attachmentAdded', 'data/attachmentRemoved',
  'data/projectAdded', 'data/projectUpdated', 'data/projectArchived', 'data/projectDeleted',
  'data/columnAdded', 'data/columnRenamed', 'data/columnDeleted', 'data/columnMoved',
  'data/workspaceAdded', 'data/workspaceUpdated', 'data/workspaceDeleted',
  'data/memberInvited', 'data/memberRoleChanged', 'data/memberRemoved',
  'data/userUpdated', 'data/projectMembersToggled',
]);

const dataSlice = createSlice({
  name: 'data',
  initialState: buildSeedState(),
  reducers: {
    /* ------------------------------ users ------------------------------- */
    userAdded(state, { payload }) {
      state.users.push(payload);
    },
    userUpdated(state, { payload: { id, patch } }) {
      const u = state.users.find((x) => x.id === id);
      if (u) Object.assign(u, patch);
    },

    /* --------------------------- workspaces ------------------------------ */
    workspaceAdded(state, { payload }) {
      state.workspaces.push(payload);
    },
    workspaceUpdated(state, { payload: { id, patch } }) {
      const ws = state.workspaces.find((x) => x.id === id);
      if (ws) Object.assign(ws, patch);
    },
    workspaceDeleted(state, { payload: { id } }) {
      const projectIds = state.projects.filter((p) => p.workspaceId === id).map((p) => p.id);
      state.workspaces = state.workspaces.filter((x) => x.id !== id);
      state.projects = state.projects.filter((p) => p.workspaceId !== id);
      state.tasks = state.tasks.filter((t) => !projectIds.includes(t.projectId));
      state.comments = state.comments.filter((c) => !state.tasks.find((t) => t.id === c.taskId));
    },
    memberInvited(state, { payload: { workspaceId, userId, role } }) {
      state.workspaces
        .find((x) => x.id === workspaceId)
        ?.members.push({ userId, role, joinedAt: new Date().toISOString() });
    },
    memberRoleChanged(state, { payload: { workspaceId, userId, role } }) {
      const m = state.workspaces.find((x) => x.id === workspaceId)?.members.find((x) => x.userId === userId);
      if (m) m.role = role;
    },
    memberRemoved(state, { payload: { workspaceId, userId } }) {
      const ws = state.workspaces.find((x) => x.id === workspaceId);
      if (ws) ws.members = ws.members.filter((m) => m.userId !== userId);
    },

    /* ----------------------------- projects ------------------------------ */
    projectAdded(state, { payload }) {
      state.projects.push(payload);
      if (Array.isArray(payload._seedTasks)) {
        payload._seedTasks.forEach((t) => state.tasks.push(t));
        delete payload._seedTasks;
      }
    },
    projectUpdated(state, { payload: { id, patch } }) {
      const p = state.projects.find((x) => x.id === id);
      if (p) Object.assign(p, patch);
    },
    projectArchived(state, { payload: { id, archived } }) {
      const p = state.projects.find((x) => x.id === id);
      if (p) p.archived = archived;
    },
    projectDeleted(state, { payload: { id } }) {
      state.projects = state.projects.filter((p) => p.id !== id);
      const taskIds = state.tasks.filter((t) => t.projectId === id).map((t) => t.id);
      state.tasks = state.tasks.filter((t) => t.projectId !== id);
      state.comments = state.comments.filter((c) => !taskIds.includes(c.taskId));
    },
    projectMembersToggled(state, { payload: { id, userId } }) {
      const p = state.projects.find((x) => x.id === id);
      if (!p) return;
      p.memberIds = p.memberIds.includes(userId)
        ? p.memberIds.filter((x) => x !== userId)
        : [...p.memberIds, userId];
    },

    /* ------------------------- kanban columns ----------------------------- */
    columnAdded(state, { payload: { projectId, column } }) {
      state.projects.find((x) => x.id === projectId)?.columns.push(column);
    },
    columnRenamed(state, { payload: { projectId, columnId, title } }) {
      const col = state.projects.find((x) => x.id === projectId)?.columns.find((c) => c.id === columnId);
      if (col) col.title = title;
    },
    columnDeleted(state, { payload: { projectId, columnId } }) {
      const p = state.projects.find((x) => x.id === projectId);
      if (!p || p.columns.length <= 1) return;
      const fallback = p.columns.find((c) => c.id !== columnId)?.id;
      p.columns = p.columns.filter((c) => c.id !== columnId);
      state.tasks.forEach((t) => {
        if (t.projectId === projectId && t.columnId === columnId) t.columnId = fallback;
      });
    },
    columnMoved(state, { payload: { projectId, from, to } }) {
      const cols = state.projects.find((x) => x.id === projectId)?.columns;
      if (!cols || from === to || from < 0 || to < 0 || from >= cols.length || to >= cols.length) return;
      const [moved] = cols.splice(from, 1);
      cols.splice(to, 0, moved);
    },

    /* ------------------------------ tasks -------------------------------- */
    taskAdded(state, { payload }) {
      state.tasks.unshift(payload);
    },
    taskPatched(state, { payload: { id, patch } }) {
      const t = state.tasks.find((x) => x.id === id);
      if (t) {
        Object.assign(t, patch);
        t.updatedAt = new Date().toISOString();
      }
    },
    // server rollback — same shape, no undo/history noise (non-undoable on purpose)
    taskServerRolledBack(state, { payload: { id, snapshot } }) {
      const i = state.tasks.findIndex((x) => x.id === id);
      if (i >= 0) state.tasks[i] = snapshot;
    },
    taskDeleted(state, { payload: { id } }) {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      state.comments = state.comments.filter((c) => c.taskId !== id);
    },
    taskRestored(state, { payload: { task, comments } }) {
      state.tasks.unshift(task);
      if (comments?.length) state.comments.push(...comments);
    },
    taskDuplicated(state, { payload: { id, newId } }) {
      const t = state.tasks.find((x) => x.id === id);
      if (!t) return;
      const copy = {
        ...structuredClone(t),
        id: newId,
        title: `${t.title} (copy)`,
        order: t.order - 0.5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      };
      state.tasks.unshift(copy);
    },

    /* ----------------------------- subtasks ------------------------------- */
    subtaskAdded(state, { payload: { taskId, subtask } }) {
      state.tasks.find((x) => x.id === taskId)?.subtasks.push(subtask);
    },
    subtaskDeleted(state, { payload: { taskId, subtaskId } }) {
      const t = state.tasks.find((x) => x.id === taskId);
      if (t) t.subtasks = t.subtasks.filter((s) => s.id !== subtaskId);
    },
    subtaskToggled(state, { payload: { taskId, subtaskId, done } }) {
      const s = state.tasks.find((x) => x.id === taskId)?.subtasks.find((x) => x.id === subtaskId);
      if (s) s.done = done;
    },
    subtaskRenamed(state, { payload: { taskId, subtaskId, title } }) {
      const s = state.tasks.find((x) => x.id === taskId)?.subtasks.find((x) => x.id === subtaskId);
      if (s) s.title = title;
    },
    // subtask -> full task
    subtaskPromoted(state, { payload: { taskId, subtaskId, newTask } }) {
      const t = state.tasks.find((x) => x.id === taskId);
      if (!t) return;
      t.subtasks = t.subtasks.filter((s) => s.id !== subtaskId);
      state.tasks.unshift(newTask);
    },
    // full task -> subtask of another task
    taskDemoted(state, { payload: { taskId, targetTaskId } }) {
      const t = state.tasks.find((x) => x.id === taskId);
      const target = state.tasks.find((x) => x.id === targetTaskId);
      if (!t || !target) return;
      target.subtasks.push({ id: `${t.id}_s`, title: t.title, done: Boolean(t.completedAt) });
      state.tasks = state.tasks.filter((x) => x.id !== taskId);
      state.comments = state.comments.filter((c) => c.taskId !== taskId);
    },

    /* ---------------------------- attachments ----------------------------- */
    attachmentAdded(state, { payload: { taskId, attachment } }) {
      state.tasks.find((x) => x.id === taskId)?.attachments.push(attachment);
    },
    attachmentRemoved(state, { payload: { taskId, attachmentId } }) {
      const t = state.tasks.find((x) => x.id === taskId);
      if (t) t.attachments = t.attachments.filter((a) => a.id !== attachmentId);
    },

    /* ------------------------------ comments ------------------------------ */
    commentAdded(state, { payload }) {
      state.comments.push(payload);
    },
    commentUpdated(state, { payload: { id, patch } }) {
      const c = state.comments.find((x) => x.id === id);
      if (c) {
        Object.assign(c, patch);
        c.editedAt = new Date().toISOString();
      }
    },
    commentDeleted(state, { payload: { id } }) {
      state.comments = state.comments.filter((c) => c.id !== id);
    },

    /* ------------------------------- import ------------------------------- */
    stateImported(state, { payload }) {
      return payload; // full replacement. one-way door, guarded by confirm()
    },
  },
});

export const {
  userAdded, userUpdated,
  workspaceAdded, workspaceUpdated, workspaceDeleted,
  memberInvited, memberRoleChanged, memberRemoved,
  projectAdded, projectUpdated, projectArchived, projectDeleted, projectMembersToggled,
  columnAdded, columnRenamed, columnDeleted, columnMoved,
  taskAdded, taskPatched, taskServerRolledBack, taskDeleted, taskRestored, taskDuplicated,
  subtaskAdded, subtaskDeleted, subtaskToggled, subtaskRenamed, subtaskPromoted, taskDemoted,
  attachmentAdded, attachmentRemoved,
  commentAdded, commentUpdated, commentDeleted,
  stateImported,
} = dataSlice.actions;

/* --------------------------------------------------------------------------
   optimistic thunks — apply instantly, fake the network, roll back on a
   fake failure so the UX flex is complete.
   -------------------------------------------------------------------------- */

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

export const patchTaskOptimistic = createAsyncThunk(
  'data/patchTaskOptimistic',
  async ({ id, patch }, { dispatch, getState }) => {
    const before = getState().data.present.tasks.find((t) => t.id === id);
    dispatch(taskPatched({ id, patch }));
    const { fakeLatency } = getState().ui.settings;
    try {
      await fakeRequest(280 + Math.random() * 320, fakeLatency ? 0.07 : 0);
      return { ok: true };
    } catch {
      dispatch(taskServerRolledBack({ id, snapshot: before }));
      return { ok: false, rolledBack: true };
    }
  }
);

export const moveTaskOptimistic = createAsyncThunk(
  'data/moveTaskOptimistic',
  async ({ id, columnId, order }, { dispatch, getState }) => {
    const before = getState().data.present.tasks.find((t) => t.id === id);
    dispatch(taskPatched({ id, patch: { columnId, order } }));
    const { fakeLatency } = getState().ui.settings;
    try {
      await fakeRequest(220 + Math.random() * 260, fakeLatency ? 0.07 : 0);
      return { ok: true };
    } catch {
      dispatch(taskServerRolledBack({ id, snapshot: before }));
      return { ok: false, rolledBack: true };
    }
  }
);

export const deleteTaskOptimistic = createAsyncThunk(
  'data/deleteTaskOptimistic',
  async ({ id }, { dispatch, getState }) => {
    const before = getState().data.present.tasks.find((t) => t.id === id);
    const beforeComments = getState().data.present.comments.filter((c) => c.taskId === id);
    dispatch(taskDeleted({ id }));
    const { fakeLatency } = getState().ui.settings;
    try {
      await fakeRequest(260 + Math.random() * 300, fakeLatency ? 0.07 : 0);
      return { ok: true };
    } catch {
      dispatch(taskRestored({ task: before, comments: beforeComments }));
      return { ok: false, rolledBack: true };
    }
  }
);

export default dataSlice.reducer;
