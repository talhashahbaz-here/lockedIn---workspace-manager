/* ==========================================================================
   store/index.js — store factory + the effects layer:
   - undoMarker flags undoable actions before they hit the reducer
   - effects middleware writes the activity log, fires notifications,
     and animates the "npc coworkers" that keep the workspace feeling live
   - debounced persistence to IndexedDB
   ========================================================================== */

import { configureStore } from '@reduxjs/toolkit';
import dataReducer, { UNDOABLE_TYPES } from './slices/dataSlice';
import logsReducer from './slices/logSlice';
import uiReducer, { uiInitialState } from './slices/uiSlice';
import { undoable } from './undo';
import { uid } from '@/config/global';
import { activityLogged, notificationPushed } from './slices/logSlice';
import { toastPushed } from './slices/uiSlice';
import { persistState } from '@/config/persistence';

/* ------------------------------- undo marker ------------------------------- */

const undoMarker = () => () => (next) => (action) => {
  if (action && typeof action.type === 'string' && UNDOABLE_TYPES.has(action.type)) {
    return next({ ...action, meta: { ...action.meta, undoable: true } });
  }
  return next(action);
};

/* ------------------------------ effect helpers ----------------------------- */

const actorOf = (action, state) => action.meta?.actorId ?? state.ui.actorId;
const userName = (state, id) => state.data.present.users.find((u) => u.id === id)?.name ?? 'someone';
const colTitle = (state, projectId, columnId) =>
  state.data.present.projects.find((p) => p.id === projectId)?.columns.find((c) => c.id === columnId)?.title ?? '?';
const taskOf = (state, id) => state.data.present.tasks.find((t) => t.id === id);

const pushActivity = (dispatch, state, entry) =>
  dispatch(activityLogged({ id: uid('a'), ts: Date.now(), ...entry }));

const pushNotification = (dispatch, state, userId, type, text, taskId = null, projectId = null) => {
  // prefs only gate notifications for the *current* user
  if (userId === state.ui.actorId && state.ui.settings.notifPrefs[type] === false) return;
  dispatch(notificationPushed({ id: uid('n'), userId, ts: Date.now(), type, text, read: false, taskId, projectId }));
};

/* ------------------------------ effects layer ------------------------------ */

const effectsMiddleware = (store) => (next) => (action) => {
  const before = store.getState();
  const result = next(action);
  const state = store.getState();

  if (!action?.type?.startsWith('data/')) return result;

  const dispatch = store.dispatch;
  const actorId = actorOf(action, before);
  if (!actorId) return result;

  switch (action.type) {
    case 'data/taskAdded': {
      const t = taskOf(state, action.payload.id);
      if (t) {
        const base = { workspaceId: t.workspaceId ?? state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id };
        pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: `created "${t.title}"` });
        if (t.assigneeId && t.assigneeId !== actorId) {
          pushNotification(dispatch, state, t.assigneeId, 'assigned', `${userName(state, actorId)} assigned you "${t.title}"`, t.id);
        }
      }
      break;
    }
    case 'data/taskPatched': {
      const { id, patch } = action.payload;
      const t = taskOf(state, id);
      if (!t) break;
      const base = { workspaceId: state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id };
      if ('columnId' in patch && patch.columnId !== before.data.present.tasks.find((x) => x.id === id)?.columnId) {
        pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: `moved "${t.title}" → ${colTitle(state, t.projectId, t.columnId)}` });
      }
      if ('completedAt' in patch) {
        pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: patch.completedAt ? `completed "${t.title}"` : `reopened "${t.title}"` });
      }
      if ('title' in patch && patch.title) {
        pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: `renamed a task to "${t.title}"` });
      }
      if ('assigneeId' in patch) {
        const from = before.data.present.tasks.find((x) => x.id === id)?.assigneeId;
        if (patch.assigneeId !== from) {
          pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: patch.assigneeId ? `put ${userName(state, patch.assigneeId)} on "${t.title}"` : `unassigned "${t.title}"` });
          if (patch.assigneeId && patch.assigneeId !== actorId) {
            pushNotification(dispatch, state, patch.assigneeId, 'assigned', `${userName(state, actorId)} assigned you "${t.title}"`, t.id);
          }
        }
      }
      if ('priority' in patch) {
        pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: `set "${t.title}" priority to ${patch.priority}` });
      }
      if ('dueDate' in patch) {
        pushActivity(dispatch, state, { ...base, actorId, type: 'task', text: patch.dueDate ? `rescheduled "${t.title}"` : `cleared the due date on "${t.title}"` });
      }
      break;
    }
    case 'data/taskDeleted': {
      const t = before.data.present.tasks.find((x) => x.id === action.payload.id);
      if (t) {
        pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id, actorId, type: 'task', text: `deleted "${t.title}"` });
      }
      break;
    }
    case 'data/taskDuplicated': {
      const t = taskOf(state, action.payload.newId);
      if (t) pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id, actorId, type: 'task', text: `duplicated "${t.title}"` });
      break;
    }
    case 'data/subtaskToggled': {
      const t = taskOf(state, action.payload.taskId);
      const st = t?.subtasks.find((s) => s.id === action.payload.subtaskId);
      if (t && st) {
        pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id, actorId, type: 'subtask', text: `${st.done ? 'checked off' : 'unchecked'} "${st.title}" in "${t.title}"` });
      }
      break;
    }
    case 'data/subtaskPromoted': {
      const nt = taskOf(state, action.payload.newTask.id);
      if (nt) pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: nt.projectId, taskId: nt.id, actorId, type: 'task', text: `promoted a subtask into "${nt.title}"` });
      break;
    }
    case 'data/taskDemoted': {
      const t = taskOf(state, action.payload.targetTaskId);
      if (t) pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id, actorId, type: 'task', text: `demoted a task into a subtask of "${t.title}"` });
      break;
    }
    case 'data/attachmentAdded': {
      const t = taskOf(state, action.payload.taskId);
      if (t) pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: t.projectId, taskId: t.id, actorId, type: 'task', text: `attached ${action.payload.attachment.name} to "${t.title}"` });
      break;
    }
    case 'data/commentAdded': {
      const c = action.payload;
      const t = taskOf(state, c.taskId);
      pushActivity(dispatch, state, { workspaceId: state.ui.currentWorkspaceId, projectId: t?.projectId ?? c.projectId, taskId: c.taskId, actorId, type: 'comment', text: `said: "${c.body.slice(0, 46)}${c.body.length > 46 ? '…' : ''}"` });
      (c.mentions ?? []).forEach((uidM) => {
        if (uidM !== actorId) {
          pushNotification(dispatch, state, uidM, 'mentioned', `${userName(state, actorId)} mentioned you on "${t?.title ?? 'a task'}"`, c.taskId);
        }
      });
      break;
    }
    case 'data/projectAdded': {
      const p = state.data.present.projects.find((x) => x.id === action.payload.id ?? action.payload.project?.id);
      if (p) pushActivity(dispatch, state, { workspaceId: p.workspaceId, projectId: p.id, actorId, type: 'project', text: `created project "${p.name}"` });
      break;
    }
    case 'data/projectUpdated': {
      const p = state.data.present.projects.find((x) => x.id === action.payload.id);
      if (p && 'name' in action.payload.patch) {
        pushActivity(dispatch, state, { workspaceId: p.workspaceId, projectId: p.id, actorId, type: 'project', text: `renamed the project to "${p.name}"` });
      }
      break;
    }
    case 'data/projectArchived': {
      const p = state.data.present.projects.find((x) => x.id === action.payload.id);
      if (p) pushActivity(dispatch, state, { workspaceId: p.workspaceId, projectId: p.id, actorId, type: 'project', text: action.payload.archived ? `archived "${p.name}"` : `restored "${p.name}" from the archive` });
      break;
    }
    case 'data/projectDeleted': {
      const p = before.data.present.projects.find((x) => x.id === action.payload.id);
      if (p) pushActivity(dispatch, state, { workspaceId: p.workspaceId, actorId, type: 'project', text: `deleted project "${p.name}". it is gone fr` });
      break;
    }
    case 'data/memberInvited': {
      const { workspaceId, userId, role } = action.payload;
      pushActivity(dispatch, state, { workspaceId, actorId, type: 'member', text: `added ${userName(state, userId)} as ${role}` });
      if (userId !== actorId) pushNotification(dispatch, state, userId, 'assigned', `${userName(state, actorId)} added you to a workspace as ${role}`, null);
      break;
    }
    case 'data/memberRoleChanged': {
      const { workspaceId, userId, role } = action.payload;
      pushActivity(dispatch, state, { workspaceId, actorId, type: 'member', text: `switched ${userName(state, userId)} to ${role}` });
      break;
    }
    case 'data/memberRemoved': {
      const { workspaceId, userId } = action.payload;
      pushActivity(dispatch, state, { workspaceId, actorId, type: 'member', text: `removed ${userName(before, userId)} from the workspace` });
      break;
    }
    case 'data/workspaceAdded': {
      pushActivity(dispatch, state, { workspaceId: action.payload.id, actorId, type: 'workspace', text: `created workspace "${action.payload.name}"` });
      break;
    }
    case 'data/workspaceUpdated': {
      if ('name' in action.payload.patch) {
        const ws = state.data.present.workspaces.find((x) => x.id === action.payload.id);
        if (ws) pushActivity(dispatch, state, { workspaceId: ws.id, actorId, type: 'workspace', text: `renamed the workspace to "${ws.name}"` });
      }
      break;
    }
    case 'data/columnRenamed': {
      const { projectId, columnId, title } = action.payload;
      const p = state.data.present.projects.find((x) => x.id === projectId);
      if (p) pushActivity(dispatch, state, { workspaceId: p.workspaceId, projectId, actorId, type: 'project', text: `renamed a column to "${title}"` });
      break;
    }
    case 'data/projectMessageSent': {
      const { projectId, text, mentions } = action.payload;
      const p = state.data.present.projects.find((x) => x.id === projectId);
      const wsId = p?.workspaceId ?? state.ui.currentWorkspaceId;
      pushActivity(dispatch, state, {
        workspaceId: wsId,
        projectId,
        actorId,
        type: 'comment',
        text: `posted in ${p?.name ?? 'project'}: "${text.slice(0, 48)}${text.length > 48 ? '…' : ''}"`,
      });
      (mentions ?? []).forEach((mUserId) => {
        if (mUserId !== actorId) {
          pushNotification(
            dispatch,
            state,
            mUserId,
            'mentioned',
            `${userName(state, actorId)} tagged you in #${p?.name ?? 'project'} discussion: "${text.slice(0, 48)}${text.length > 48 ? '…' : ''}"`,
            null,
            projectId
          );
          dispatch(toastPushed({ tone: 'live', text: `${userName(state, actorId)} tagged you in ${p?.name ?? 'project'}` }));
        }
      });
      break;
    }
    case 'data/joinRequestCreated': {
      const { projectId } = action.payload;
      const p = state.data.present.projects.find((x) => x.id === projectId);
      const wsId = p?.workspaceId ?? state.ui.currentWorkspaceId;
      pushActivity(dispatch, state, {
        workspaceId: wsId,
        projectId,
        actorId,
        type: 'project',
        text: `requested to join project "${p?.name ?? 'project'}"`,
      });
      // notify project members / admins
      const ws = state.data.present.workspaces.find((w) => w.id === wsId);
      const adminMembers = ws?.members.filter((m) => (m.role === 'owner' || m.role === 'admin') && m.userId !== actorId) ?? [];
      adminMembers.forEach((adm) => {
        pushNotification(
          dispatch,
          state,
          adm.userId,
          'assigned',
          `${userName(state, actorId)} requested to join "${p?.name ?? 'project'}"`,
          null,
          projectId
        );
      });
      break;
    }
    case 'data/joinRequestApproved': {
      const { projectId, userId } = action.payload;
      const p = state.data.present.projects.find((x) => x.id === projectId);
      const wsId = p?.workspaceId ?? state.ui.currentWorkspaceId;
      pushActivity(dispatch, state, {
        workspaceId: wsId,
        projectId,
        actorId,
        type: 'member',
        text: `approved ${userName(state, userId)} to join project "${p?.name ?? 'project'}"`,
      });
      if (userId !== actorId) {
        pushNotification(
          dispatch,
          state,
          userId,
          'assigned',
          `Your request to join "${p?.name ?? 'project'}" was approved! You now have member access.`,
          null,
          projectId
        );
      }
      break;
    }
    case 'data/projectMembersToggled': {
      const { id: projectId, userId } = action.payload;
      const p = state.data.present.projects.find((x) => x.id === projectId);
      const isMemberNow = p?.memberIds.includes(userId);
      pushActivity(dispatch, state, {
        workspaceId: p?.workspaceId ?? state.ui.currentWorkspaceId,
        projectId,
        actorId,
        type: 'member',
        text: `${isMemberNow ? 'added' : 'removed'} ${userName(state, userId)} ${isMemberNow ? 'to' : 'from'} "${p?.name ?? 'project'}"`,
      });
      break;
    }
    default:
      break;
  }

  return result;
};

/* ------------------------------- persistence -------------------------------- */

const PERSIST_KEYS_UI = ['currentWorkspaceId', 'projectViews', 'groupBy', 'filters', 'sort', 'savedPresets', 'settings'];
let persistTimer = null;

function schedulePersist(store) {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const s = store.getState();
    persistState({
      data: s.data.present,
      logs: s.logs,
      ui: Object.fromEntries(PERSIST_KEYS_UI.map((k) => [k, s.ui[k]])),
    });
  }, 400);
}

/* --------------------------------- factory --------------------------------- */

const wrappedDataReducer = undoable(dataReducer);

export const setupStore = (hydrated) => {
  const store = configureStore({
    reducer: { data: wrappedDataReducer, logs: logsReducer, ui: uiReducer },
    preloadedState: hydrated
      ? {
          data: { past: [], present: hydrated.data, future: [] },
          logs: hydrated.logs,
          ui: { ...uiInitialState, ...hydrated.ui, online: navigator.onLine },
        }
      : undefined,
    middleware: (gDM) => gDM({ serializableCheck: false }).concat([undoMarker(), effectsMiddleware]),
  });

  store.subscribe(() => schedulePersist(store));
  return store;
};
