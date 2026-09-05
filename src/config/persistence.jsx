/* ==========================================================================
   persistence — the fake backend's storage unit.
   - whole app state lives in IndexedDB (attachments get chunky)
   - session + theme live in localStorage (fast boot)
   - fakeRequest simulates a network so we can flex optimistic UX + rollback
   ========================================================================== */

import { STORAGE_KEYS } from './global';
import { buildSeedState, buildSeedLogs } from './mockData';

/* ------------------------------ tiny idb wrapper -------------------------- */

const DB_NAME = 'lockedin';
const STORE = 'state';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idbSet = async (key, value) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

export const idbGet = async (key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
};

export const idbClear = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

/* ------------------------------- localStorage ----------------------------- */

export const lsGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — vibes unaffected */
  }
};

export const lsRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* no cap it's fine */
  }
};

/* ------------------------------ the fake network -------------------------- */

/**
 * pretends to be a server. resolves after `ms`, rejects `failRate` of the time
 * so optimistic updates have something to roll back from.
 */
export const fakeRequest = (ms, failRate = 0) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) reject(new Error('mock server ghosted us'));
      else resolve({ ok: true, vibes: 'immaculate' });
    }, ms);
  });

/* ------------------------------- hydration -------------------------------- */

export async function hydrateState() {
  try {
    const saved = await idbGet(STORAGE_KEYS.state);
    if (saved && saved.version === 2 && Array.isArray(saved.data?.tasks)) {
      return saved;
    }
  } catch {
    /* corrupted or unavailable — reseed below */
  }
  return {
    version: 2,
    savedAt: Date.now(),
    data: buildSeedState(),
    logs: buildSeedLogs(),
    ui: {
      currentWorkspaceId: 'ws_hq',
      projectViews: {},
      filters: { q: '', assigneeIds: [], priorities: [], statuses: [], labels: [], dueFrom: null, dueTo: null },
      sort: { by: 'due', dir: 'asc' },
      savedPresets: [],
      settings: {
        theme: 'light',
        defaultView: 'board',
        notifPrefs: { assigned: true, mentioned: true, due: true, npc: true },
        npcMode: true,
        fakeLatency: true,
      },
    },
  };
}

export async function persistState(payload) {
  try {
    await idbSet(STORAGE_KEYS.state, { ...payload, version: 2, savedAt: Date.now() });
  } catch {
    /* offline / quota — the app keeps running on state alone */
  }
}

/* --------------------------------- export --------------------------------- */

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* --------------------------------- import ---------------------------------- */

/**
 * validates an imported workspace blob. returns { ok, errors, summary }.
 * expected shape from exportWorkspace: { app: 'lockedin', kind: 'workspace', version, workspace, projects, tasks, comments }
 */
export function validateImport(parsed) {
  const errors = [];
  const summary = { workspaces: 0, projects: 0, tasks: 0, comments: 0 };

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, errors: ['File is not valid JSON.'], summary };
  }
  if (parsed.app !== 'lockedin') errors.push('This file was not exported from LockedIn.');
  if (parsed.kind !== 'workspace' && parsed.kind !== 'full') errors.push('unknown export kind');
  if (parsed.version !== 1) errors.push('Unknown export version.');

  const ws = parsed.workspace;
  if (!ws || typeof ws !== 'object' || typeof ws.id !== 'string' || typeof ws.name !== 'string' || !Array.isArray(ws.members)) {
    errors.push('workspace entry is malformed');
  } else {
    summary.workspaces = 1;
  }

  const isTask = (x) => x && typeof x === 'object' && typeof x.id === 'string' && typeof x.title === 'string';
  if (!Array.isArray(parsed.projects)) errors.push('projects array missing');
  else summary.projects = parsed.projects.length;
  if (!Array.isArray(parsed.tasks)) errors.push('tasks array missing');
  else {
    if (parsed.tasks.some((x) => !isTask(x))) errors.push('some tasks are malformed');
    summary.tasks = parsed.tasks.length;
  }
  if (!Array.isArray(parsed.comments)) errors.push('comments array missing');
  else summary.comments = parsed.comments.length;

  return { ok: errors.length === 0, errors, summary };
}
