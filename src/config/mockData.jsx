/* ==========================================================================
   mock data — the fake backend. deliberately small: two workspaces, five
   projects, a handful of tasks so screens stay readable.
   password for every mock account: frfr1234
   ========================================================================== */

import { DEFAULT_COLUMNS } from './global';

// helper: date offset from today in days
const days = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};
const hoursAgo = (n) => new Date(Date.now() - n * 3600 * 1000).toISOString();

export const MOCK_PASSWORD = 'frfr1234';

const users = [
  { id: 'u_jules', name: 'jules chen', email: 'jules@lockedin.fun', password: MOCK_PASSWORD, emoji: '🦈', color: 'lime', bio: 'Product engineer. Owns the roadmap.' },
  { id: 'u_zara', name: 'zara iman', email: 'zara@lockedin.fun', password: MOCK_PASSWORD, emoji: '🦋', color: 'pink', bio: 'Product designer. Typography nerd.' },
  { id: 'u_marco', name: 'marco reyes', email: 'marco@lockedin.fun', password: MOCK_PASSWORD, emoji: '🤖', color: 'blue', bio: 'Backend developer.' },
  { id: 'u_trent', name: 'trent smith', email: 'trent@lockedin.fun', password: MOCK_PASSWORD, emoji: '🧔', color: 'orange', bio: 'Engineering manager.' },
];

const workspaces = [
  {
    id: 'ws_hq',
    name: 'acme hq',
    emoji: '🧢',
    color: 'lime',
    defaultView: 'board',
    createdAt: days(-90),
    members: [
      { userId: 'u_jules', role: 'owner', joinedAt: days(-90) },
      { userId: 'u_marco', role: 'admin', joinedAt: days(-80) },
      { userId: 'u_zara', role: 'member', joinedAt: days(-45) },
      { userId: 'u_trent', role: 'viewer', joinedAt: days(-20) },
    ],
  },
  {
    id: 'ws_personal',
    name: 'personal',
    emoji: '🏠',
    color: 'pink',
    defaultView: 'list',
    createdAt: days(-40),
    members: [
      { userId: 'u_jules', role: 'owner', joinedAt: days(-40) },
      { userId: 'u_zara', role: 'member', joinedAt: days(-39) },
    ],
  },
];

const projects = [
  {
    id: 'p_rebrand', workspaceId: 'ws_hq', name: 'rebrand v2', emoji: '✨', color: 'pink',
    description: 'New logo, new type system, new site.',
    archived: false, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), memberIds: ['u_jules', 'u_zara'],
    createdAt: days(-21),
  },
  {
    id: 'p_rewrite', workspaceId: 'ws_hq', name: 'app rewrite', emoji: '🏗️', color: 'blue',
    description: 'Rebuild the core app on a cleaner architecture.',
    archived: false, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), memberIds: ['u_jules', 'u_marco'],
    createdAt: days(-14),
  },
  {
    id: 'p_launch', workspaceId: 'ws_hq', name: 'launch week', emoji: '🚀', color: 'yellow',
    description: 'The release checklist, day by day.',
    archived: false,
    columns: [
      { id: 'col_backlog', title: 'backlog' },
      { id: 'col_next', title: 'up next' },
      { id: 'col_doing', title: 'in progress' },
      { id: 'col_review', title: 'in review' },
      { id: 'col_done', title: 'done' },
    ],
    memberIds: ['u_jules', 'u_marco', 'u_zara'],
    createdAt: days(-7),
  },
  {
    id: 'p_bugs', workspaceId: 'ws_hq', name: 'bug backlog (archived)', emoji: '🐛', color: 'red',
    description: 'The old bug tracker, kept for reference.',
    archived: true, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), memberIds: ['u_marco'],
    createdAt: days(-60),
  },
  {
    id: 'p_life', workspaceId: 'ws_personal', name: 'errands', emoji: '📌', color: 'teal',
    description: 'Life admin in one place.',
    archived: false, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), memberIds: ['u_jules', 'u_zara'],
    createdAt: days(-12),
  },
];

let tOrder = 0;
const t = (over) => ({
  order: tOrder++,
  subtasks: [],
  attachments: [],
  labels: [],
  createdAt: days(-10),
  updatedAt: days(-2),
  ...over,
});

const tasks = [
  // ---- rebrand v2
  t({ id: 't_001', projectId: 'p_rebrand', columnId: 'col_done', title: 'Pick the new wordmark', description: 'Space Grotesk vs Archivo — decision and rationale.', priority: 'medium', dueDate: days(-3), assigneeId: 'u_zara', labels: ['design'], createdById: 'u_jules', completedAt: days(-3),
    subtasks: [{ id: 'st_1', title: 'Moodboard', done: true }, { id: 'st_2', title: 'Present options to the team', done: true }] }),
  t({ id: 't_002', projectId: 'p_rebrand', columnId: 'col_doing', title: 'Design system tokens', description: 'Colors, spacing, typography scale.', priority: 'high', dueDate: days(1), assigneeId: 'u_zara', labels: ['design'], createdById: 'u_jules',
    subtasks: [{ id: 'st_3', title: 'Color palette', done: true }, { id: 'st_4', title: 'Type scale', done: true }, { id: 'st_5', title: 'Component styles', done: false }] }),
  t({ id: 't_003', projectId: 'p_rebrand', columnId: 'col_next', title: 'Rewrite the landing page copy', description: 'Clear, direct, no filler.', priority: 'medium', dueDate: days(3), assigneeId: 'u_zara', labels: ['content'], createdById: 'u_jules' }),

  // ---- app rewrite
  t({ id: 't_010', projectId: 'p_rewrite', columnId: 'col_doing', title: 'Schema migration plan', description: 'Move Postgres to the new schema with zero downtime.', priority: 'urgent', dueDate: days(0), assigneeId: 'u_marco', labels: ['backend', 'asap'], createdById: 'u_jules',
    subtasks: [{ id: 'st_6', title: 'Map old tables', done: true }, { id: 'st_7', title: 'Write migrations', done: false }] }),
  t({ id: 't_011', projectId: 'p_rewrite', columnId: 'col_doing', title: 'Component architecture', description: 'Break the app into composable pieces.', priority: 'high', dueDate: days(2), assigneeId: 'u_jules', labels: ['frontend'], createdById: 'u_jules' }),
  t({ id: 't_012', projectId: 'p_rewrite', columnId: 'col_next', title: 'Auth flow rewrite', description: 'Sessions, tokens, refresh handling.', priority: 'medium', dueDate: days(5), assigneeId: 'u_marco', labels: ['backend'], createdById: 'u_marco' }),
  t({ id: 't_013', projectId: 'p_rewrite', columnId: 'col_done', title: 'Monorepo setup', description: 'One repo, shared tooling.', priority: 'medium', dueDate: days(-6), assigneeId: 'u_marco', labels: ['planning'], createdById: 'u_jules', completedAt: days(-6) }),

  // ---- launch week
  t({ id: 't_020', projectId: 'p_launch', columnId: 'col_doing', title: 'Freeze the feature list', description: 'No new scope until release.', priority: 'urgent', dueDate: days(0), assigneeId: 'u_jules', labels: ['asap'], createdById: 'u_jules' }),
  t({ id: 't_021', projectId: 'p_launch', columnId: 'col_review', title: 'Launch video edit', description: 'Final cut for the announcement.', priority: 'high', dueDate: days(1), assigneeId: 'u_zara', labels: ['content'], createdById: 'u_jules' }),
  t({ id: 't_022', projectId: 'p_launch', columnId: 'col_next', title: 'Press kit and screenshots', description: 'Assets for the announcement post.', priority: 'medium', dueDate: days(2), assigneeId: 'u_zara', labels: ['design', 'content'], createdById: 'u_jules' }),

  // ---- bug backlog (archived)
  t({ id: 't_030', projectId: 'p_bugs', columnId: 'col_done', title: 'Login 500 error', description: 'Fixed — was a timezone bug in the session check.', priority: 'medium', dueDate: days(-50), assigneeId: 'u_marco', labels: ['bug'], createdById: 'u_marco', completedAt: days(-48) }),

  // ---- errands
  t({ id: 't_040', projectId: 'p_life', columnId: 'col_next', title: 'Book dentist appointment', description: '', priority: 'high', dueDate: days(2), assigneeId: 'u_jules', labels: ['asap'], createdById: 'u_jules' }),
  t({ id: 't_041', projectId: 'p_life', columnId: 'col_backlog', title: 'Renew passport', description: 'Form + photo + fee.', priority: 'medium', dueDate: null, assigneeId: 'u_zara', labels: ['planning'], createdById: 'u_zara' }),
];

const comments = [
  { id: 'c_001', taskId: 't_002', authorId: 'u_jules', body: '@zara these tokens look great. can we make lime the primary color?', mentions: ['u_zara'], createdAt: hoursAgo(26) },
  { id: 'c_002', taskId: 't_002', authorId: 'u_zara', body: 'Thanks! Yes — updating the contrast pass today.', mentions: [], createdAt: hoursAgo(22) },
  { id: 'c_003', taskId: 't_010', authorId: 'u_marco', body: 'Migrations are written. Running the dry run on staging tonight.', mentions: [], createdAt: hoursAgo(6) },
];

const activity = [
  { id: 'a_001', ts: hoursAgo(50), actorId: 'u_jules', type: 'project', workspaceId: 'ws_hq', projectId: 'p_rebrand', text: 'created project "rebrand v2"' },
  { id: 'a_002', ts: hoursAgo(48), actorId: 'u_zara', type: 'task', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_001', text: 'created "Pick the new wordmark"' },
  { id: 'a_003', ts: hoursAgo(47), actorId: 'u_zara', type: 'task', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_001', text: 'moved "Pick the new wordmark" → done' },
  { id: 'a_004', ts: hoursAgo(30), actorId: 'u_jules', type: 'comment', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_002', text: 'commented: "these tokens look great..."' },
  { id: 'a_005', ts: hoursAgo(10), actorId: 'u_marco', type: 'task', workspaceId: 'ws_hq', projectId: 'p_rewrite', taskId: 't_010', text: 'moved "Schema migration plan" → in progress' },
  { id: 'a_006', ts: hoursAgo(6), actorId: 'u_marco', type: 'subtask', workspaceId: 'ws_hq', projectId: 'p_rewrite', taskId: 't_010', text: 'completed "Map old tables" in "Schema migration plan"' },
];

const notifications = [
  { id: 'n_001', userId: 'u_jules', ts: hoursAgo(26), type: 'mentioned', text: 'zara iman mentioned you on "Design system tokens"', read: false, taskId: 't_002' },
  { id: 'n_002', userId: 'u_jules', ts: hoursAgo(8), type: 'due', text: '"Freeze the feature list" is due today.', read: false, taskId: 't_020' },
];

export const buildSeedState = () => ({
  version: 1,
  users,
  workspaces,
  projects,
  tasks,
  comments,
});

export const buildSeedLogs = () => ({
  activity,
  notifications,
});
