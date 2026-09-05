/* ==========================================================================
   global config — statuses, priorities, roles, permissions, colors, and
   project templates. the marketing site keeps the slang; this file talks
   normally.
   ========================================================================== */

export const APP_NAME = 'LockedIn';
export const APP_TAGLINE = 'lock in. ship. repeat.';
export const STORAGE_KEYS = {
  session: 'lockedin-session',
  theme: 'lockedin-theme',
  state: 'lockedin-state',
};

/* ---------------------------------- ids ---------------------------------- */

let _idCounter = 0;
export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${(_idCounter++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

/* -------------------------------- kanban --------------------------------- */

// default columns a project starts with. fully customizable per project.
export const DEFAULT_COLUMNS = [
  { id: 'col_backlog', title: 'backlog' },
  { id: 'col_next', title: 'up next' },
  { id: 'col_doing', title: 'in progress' },
  { id: 'col_done', title: 'done' },
];

/* -------------------------------- priority ------------------------------- */

export const PRIORITIES = [
  { id: 'low', label: 'low', color: '#b9b5ab' },
  { id: 'medium', label: 'medium', color: '#ffd23f' },
  { id: 'high', label: 'high', color: '#ff9a62' },
  { id: 'urgent', label: 'urgent', color: '#ff6b6b' },
];
export const priorityOf = (id) => PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];

/* --------------------------------- labels -------------------------------- */

export const LABEL_POOL = [
  'design', 'frontend', 'backend', 'research', 'bug', 'content', 'asap', 'meetings', 'planning',
];

/* --------------------------------- colors -------------------------------- */

export const COLOR_POOL = [
  { id: 'lime', hex: '#c6f32e', name: 'lime' },
  { id: 'pink', hex: '#ff90e8', name: 'pink' },
  { id: 'blue', hex: '#7eb6ff', name: 'blue' },
  { id: 'yellow', hex: '#ffd23f', name: 'yellow' },
  { id: 'lilac', hex: '#c5a3ff', name: 'lilac' },
  { id: 'orange', hex: '#ff9a62', name: 'orange' },
  { id: 'teal', hex: '#63e6be', name: 'teal' },
  { id: 'red', hex: '#ff6b6b', name: 'red' },
];
export const colorOf = (id) => COLOR_POOL.find((c) => c.id === id) ?? COLOR_POOL[0];

/* --------------------------- roles & permissions ------------------------- */

export const ROLES = ['owner', 'admin', 'member', 'viewer'];

export const ROLE_VIBES = {
  owner: 'full control',
  admin: 'can manage everything',
  member: 'can work on tasks',
  viewer: 'read-only access',
};

const PERMISSION_MATRIX = {
  editTasks: ['owner', 'admin', 'member'],
  deleteTasks: ['owner', 'admin', 'member'],
  comment: ['owner', 'admin', 'member'],
  createProjects: ['owner', 'admin', 'member'],
  manageProjects: ['owner', 'admin'], // rename/archive/delete project + columns
  inviteMembers: ['owner', 'admin'],
  assignRoles: ['owner'],
  removeMembers: ['owner'],
  manageWorkspace: ['owner', 'admin'], // workspace settings
  deleteWorkspace: ['owner'],
  importData: ['owner', 'admin'],
  exportData: ['owner', 'admin'], // full-workspace export is an admin power
  syncData: ['owner', 'admin', 'member', 'viewer'],
};

export const can = (role, action) =>
  Boolean(PERMISSION_MATRIX[action]?.includes(role));

/* ----------------------------- project templates -------------------------- */

export const PROJECT_TEMPLATES = [
  {
    id: 'blank',
    name: 'blank project',
    emoji: '📄',
    description: 'no starter tasks. build it your way.',
    tasks: [],
  },
  {
    id: 'bughunt',
    name: 'bug fix',
    emoji: '🐛',
    description: 'track, fix and verify bugs.',
    tasks: [
      { title: 'Triage the bug backlog', priority: 'high', labels: ['bug'] },
      { title: 'Reproduce the top 3 issues', priority: 'medium', labels: ['bug', 'research'] },
      { title: 'Ship the fixes', priority: 'urgent', labels: ['bug', 'asap'] },
      { title: 'Add regression tests', priority: 'low', labels: ['planning'] },
    ],
  },
  {
    id: 'launch',
    name: 'launch week',
    emoji: '🚀',
    description: 'everything a release needs, in order.',
    tasks: [
      { title: 'Freeze the feature list', priority: 'urgent', labels: ['asap'] },
      { title: 'Write launch copy', priority: 'high', labels: ['content'] },
      { title: 'Prepare social posts', priority: 'medium', labels: ['content'] },
      { title: 'Full QA pass', priority: 'high', labels: ['bug'] },
      { title: 'Ship and monitor metrics', priority: 'urgent', labels: ['asap'] },
      { title: 'Post-mortem meeting', priority: 'low', labels: ['meetings'] },
    ],
  },
  {
    id: 'content',
    name: 'content calendar',
    emoji: '🎬',
    description: 'plan and produce content on a schedule.',
    tasks: [
      { title: 'Brainstorm 20 ideas, pick 5', priority: 'medium', labels: ['research'] },
      { title: 'Write the scripts', priority: 'high', labels: ['content'] },
      { title: 'Design the assets', priority: 'high', labels: ['design', 'content'] },
      { title: 'Schedule posts and write captions', priority: 'medium', labels: ['content'] },
      { title: 'Reply to comments', priority: 'low', labels: ['meetings'] },
    ],
  },
  {
    id: 'personal',
    name: 'personal list',
    emoji: '📌',
    description: 'life admin, but organized.',
    tasks: [
      { title: 'Brain dump everything here', priority: 'medium', labels: ['planning'] },
      { title: 'Book that appointment you keep avoiding', priority: 'high', labels: ['asap'] },
      { title: 'Take an actual break', priority: 'low', labels: ['meetings'] },
    ],
  },
];

/* --------------------------------- dates --------------------------------- */

export const dayKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const m = `${dt.getMonth() + 1}`.padStart(2, '0');
  const day = `${dt.getDate()}`.padStart(2, '0');
  return `${dt.getFullYear()}-${m}-${day}`;
};

// <input type="date"> only accepts yyyy-mm-dd — task dates may be stored as
// full ISO timestamps, so normalize before binding (local timezone, like dayKey)
export const toDateInputValue = (d) => {
  if (!d) return '';
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : dayKey(d);
};

export const isOverdue = (dueDate) =>
  Boolean(dueDate) && new Date(dueDate).setHours(23, 59, 59, 999) < Date.now();

export const isDueSoon = (dueDate) => {
  if (!dueDate) return false;
  const d = new Date(dueDate).setHours(23, 59, 59, 999);
  const now = Date.now();
  return d >= now && d - now < 24 * 60 * 60 * 1000;
};

export const friendlyDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const diffDays = Math.round(
    (new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (Math.abs(diffDays) < 7)
    return diffDays > 0 ? `in ${diffDays}d` : `${-diffDays}d ago`;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const timeAgo = (ts) => {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* -------------------------------- validation ------------------------------ */

export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
