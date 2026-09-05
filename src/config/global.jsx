/* ==========================================================================
   global config — the rules of the game. statuses, priorities, roles,
   permissions, colors, project templates. all the vibes live here.
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
  { id: 'col_icebox', title: 'icebox' },
  { id: 'col_upnext', title: 'up next' },
  { id: 'col_cookin', title: "cookin'" },
  { id: 'col_shipped', title: 'shipped' },
];

/* -------------------------------- priority ------------------------------- */

export const PRIORITIES = [
  { id: 'lowkey', label: 'lowkey', color: '#b9b5ab' },
  { id: 'mid', label: 'mid', color: '#ffd23f' },
  { id: 'highkey', label: 'highkey', color: '#ff9a62' },
  { id: 'drop', label: 'drop everything', color: '#ff6b6b' },
];
export const priorityOf = (id) => PRIORITIES.find((p) => p.id === id) ?? PRIORITIES[1];

/* --------------------------------- labels -------------------------------- */

export const LABEL_POOL = [
  'design', 'frontend', 'backend', 'copy', 'research', 'chore',
  'bug', 'feature', 'vibe-check', 'asap', 'meetings', 'content',
];

/* --------------------------------- colors -------------------------------- */

export const COLOR_POOL = [
  { id: 'lime', hex: '#c6f32e', name: 'goated' },
  { id: 'pink', hex: '#ff90e8', name: 'slay' },
  { id: 'blue', hex: '#7eb6ff', name: 'chill' },
  { id: 'yellow', hex: '#ffd23f', name: 'main character' },
  { id: 'lilac', hex: '#c5a3ff', name: 'dreamy' },
  { id: 'orange', hex: '#ff9a62', name: 'spicy' },
  { id: 'teal', hex: '#63e6be', name: 'clean' },
  { id: 'red', hex: '#ff6b6b', name: 'cooked' },
];
export const colorOf = (id) => COLOR_POOL.find((c) => c.id === id) ?? COLOR_POOL[0];

/* --------------------------- roles & permissions ------------------------- */

export const ROLES = ['owner', 'admin', 'member', 'viewer'];

export const ROLE_VIBES = {
  owner: 'runs the show',
  admin: 'has the range',
  member: 'gets it done',
  viewer: 'lurks (respectfully)',
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
  exportData: ['owner', 'admin', 'member', 'viewer'],
  syncData: ['owner', 'admin', 'member', 'viewer'],
};

export const can = (role, action) =>
  Boolean(PERMISSION_MATRIX[action]?.includes(role));

/* ----------------------------- project templates -------------------------- */

export const PROJECT_TEMPLATES = [
  {
    id: 'blank',
    name: 'from scratch (brave)',
    emoji: '🫡',
    description: 'nothing but vibes. build it your way.',
    tasks: [],
  },
  {
    id: 'bughunt',
    name: 'bug hunt',
    emoji: '🐛',
    description: 'smash the bugs before they smash you.',
    tasks: [
      { title: 'triage the bug backlog', priority: 'highkey', labels: ['bug'] },
      { title: 'repro the top 3 crashes', priority: 'mid', labels: ['bug', 'research'] },
      { title: 'ship the fixes', priority: 'drop', labels: ['bug', 'asap'] },
      { title: 'write regression tests so it never happens again', priority: 'lowkey', labels: ['chore'] },
    ],
  },
  {
    id: 'launch',
    name: 'launch week',
    emoji: '🚀',
    description: 'seven days. one launch. zero chill.',
    tasks: [
      { title: 'freeze the feature list fr', priority: 'drop', labels: ['asap'] },
      { title: 'write the launch copy', priority: 'highkey', labels: ['copy', 'content'] },
      { title: 'prep socials (tease it)', priority: 'mid', labels: ['content'] },
      { title: 'QA pass like your life depends on it', priority: 'highkey', labels: ['bug'] },
      { title: 'ship it + watch the metrics', priority: 'drop', labels: ['asap'] },
      { title: 'post-mortem + snacks', priority: 'lowkey', labels: ['meetings'] },
    ],
  },
  {
    id: 'content',
    name: 'content drop',
    emoji: '🎬',
    description: 'feed the algorithm before it eats you.',
    tasks: [
      { title: 'brainstorm 20 ideas, keep 5', priority: 'mid', labels: ['research'] },
      { title: 'script the bangers', priority: 'highkey', labels: ['copy'] },
      { title: 'film / design the assets', priority: 'highkey', labels: ['design', 'content'] },
      { title: 'schedule + caption check', priority: 'mid', labels: ['content'] },
      { title: 'engage the comments bestie', priority: 'lowkey', labels: ['chore'] },
    ],
  },
  {
    id: 'personal',
    name: 'personal chaos',
    emoji: '🌀',
    description: 'life admin but make it manageable.',
    tasks: [
      { title: 'brain dump everything here', priority: 'mid', labels: ['chore'] },
      { title: 'book that appointment you keep avoiding', priority: 'highkey', labels: ['asap'] },
      { title: 'touch grass (recurring)', priority: 'lowkey', labels: ['vibe-check'] },
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
  const today = new Date();
  const diffDays = Math.round(
    (new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000
  );
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tmrw';
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
