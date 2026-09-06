/* ==========================================================================
   uiSlice — everything ephemeral-ish: active workspace, view prefs, filters,
   saved presets, theme, notif prefs, modal state, bulk selection, toasts.
   persisted alongside data (minus the truly ephemeral bits).
   ========================================================================== */

import { createSlice } from '@reduxjs/toolkit';
import { uid } from '@/config/global';

export const EMPTY_FILTERS = {
  q: '',
  assigneeIds: [],
  priorities: [],
  statuses: [],
  labels: [],
  dueFrom: null,
  dueTo: null,
};

export const uiInitialState = {
  actorId: null, // mirror of the auth session, set on login/switch
  currentWorkspaceId: null,
  projectViews: {}, // projectId -> 'board' | 'list' | 'calendar'
  groupBy: 'none', // list view: none | assignee | status | priority | label
  filters: { ...EMPTY_FILTERS },
  sort: { by: 'due', dir: 'asc' },
  savedPresets: [], // {id, workspaceId, name, filters, sort}
  settings: {
    theme: 'light',
    defaultView: 'board',
    notifPrefs: { assigned: true, mentioned: true, due: true },
    fakeLatency: false,
  },
  // ephemeral (never persisted)
  paletteOpen: false,
  mobileNavOpen: false,
  sidebarCollapsed: false,
  logSidebarOpen: false,
  detailTaskId: null,
  composer: null, // {projectId, columnId, dueDate} | null
  bulk: { active: false, ids: [] },
  loading: {}, // scope -> bool
  syncStatus: 'idle',
  online: true,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: uiInitialState,
  reducers: {
    actorSet(state, { payload }) {
      state.actorId = payload;
    },
    workspaceSwitched(state, { payload }) {
      state.currentWorkspaceId = payload;
      state.bulk = { active: false, ids: [] };
    },
    projectViewSet(state, { payload: { projectId, view } }) {
      state.projectViews[projectId] = view;
    },
    groupBySet(state, { payload }) {
      state.groupBy = payload;
    },
    filtersPatched(state, { payload }) {
      Object.assign(state.filters, payload);
    },
    filtersCleared(state) {
      state.filters = { ...EMPTY_FILTERS };
    },
    sortSet(state, { payload }) {
      state.sort = payload;
    },
    presetSaved(state, { payload: { workspaceId, name, filters, sort } }) {
      state.savedPresets.push({ id: uid('preset'), workspaceId, name, filters, sort });
    },
    presetDeleted(state, { payload }) {
      state.savedPresets = state.savedPresets.filter((p) => p.id !== payload);
    },
    settingsPatched(state, { payload }) {
      Object.assign(state.settings, payload);
    },
    paletteToggled(state, { payload }) {
      state.paletteOpen = payload ?? !state.paletteOpen;
    },
    mobileNavToggled(state, { payload }) {
      state.mobileNavOpen = payload ?? !state.mobileNavOpen;
    },
    sidebarToggled(state, { payload }) {
      state.sidebarCollapsed = typeof payload === 'boolean' ? payload : !state.sidebarCollapsed;
    },
    logSidebarToggled(state, { payload }) {
      state.logSidebarOpen = typeof payload === 'boolean' ? payload : !state.logSidebarOpen;
    },
    detailTaskOpened(state, { payload }) {
      state.detailTaskId = payload;
    },
    detailTaskClosed(state) {
      state.detailTaskId = null;
    },
    composerOpened(state, { payload }) {
      state.composer = payload ?? {};
    },
    composerClosed(state) {
      state.composer = null;
    },
    bulkToggled(state, { payload }) {
      state.bulk.active = payload ?? !state.bulk.active;
      if (!state.bulk.active) state.bulk.ids = [];
    },
    bulkIdToggled(state, { payload }) {
      state.bulk.ids = state.bulk.ids.includes(payload)
        ? state.bulk.ids.filter((x) => x !== payload)
        : [...state.bulk.ids, payload];
    },
    bulkSet(state, { payload }) {
      state.bulk.ids = payload;
    },
    bulkCleared(state) {
      state.bulk = { active: false, ids: [] };
    },
    loadingSet(state, { payload: { scope, value } }) {
      state.loading[scope] = value;
    },
    syncStatusSet(state, { payload }) {
      state.syncStatus = payload;
    },
    onlineSet(state, { payload }) {
      state.online = payload;
    },
    toastPushed(state, { payload }) {
      state.toasts.push({
        id: uid('toast'),
        ts: Date.now(),
        tone: 'default',
        ...payload,
      });
      if (state.toasts.length > 5) state.toasts.shift();
    },
    toastDismissed(state, { payload }) {
      state.toasts = state.toasts.filter((t) => t.id !== payload);
    },
    uiReset(state, { payload }) {
      // after a data reset/import: keep settings, drop navigation state
      const { settings, currentWorkspaceId } = state;
      return {
        ...state,
        currentWorkspaceId,
        projectViews: {},
        filters: { ...EMPTY_FILTERS },
        sort: { by: 'due', dir: 'asc' },
        savedPresets: [],
        settings: payload?.settings ?? settings,
        paletteOpen: false,
        detailTaskId: null,
        composer: null,
        bulk: { active: false, ids: [] },
        toasts: [],
      };
    },
  },
});

export const {
  actorSet, workspaceSwitched, projectViewSet, groupBySet,
  filtersPatched, filtersCleared, sortSet, presetSaved, presetDeleted,
  settingsPatched, paletteToggled, mobileNavToggled, sidebarToggled, logSidebarToggled,
  detailTaskOpened, detailTaskClosed, composerOpened, composerClosed,
  bulkToggled, bulkIdToggled, bulkSet, bulkCleared,
  loadingSet, syncStatusSet, onlineSet, toastPushed, toastDismissed, uiReset,
} = uiSlice.actions;

export default uiSlice.reducer;
