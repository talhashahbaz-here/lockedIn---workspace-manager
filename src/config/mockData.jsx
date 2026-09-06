/* ==========================================================================
   mock data — mock users, roles, workspaces, projects, tasks, and discussions.
   simulated NPC behavior completely removed.
   passwords stored in passwords.txt in the workspace root.
   ========================================================================== */

import { DEFAULT_COLUMNS } from './global';

// helpers
const days = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
};
const hoursAgo = (n) => new Date(Date.now() - n * 3600 * 1000).toISOString();

export const MOCK_USERS = {
  owner: {
    id: 'u_owner',
    name: 'olivia owner',
    email: 'owner@lockedin.fun',
    password: 'OwnerPass123!',
    role: 'owner',
    emoji: '👑',
    color: 'lime',
    bio: 'Workspace Owner. Full privileges.',
  },
  admin: {
    id: 'u_admin',
    name: 'alex admin',
    email: 'admin@lockedin.fun',
    password: 'AdminPass123!',
    role: 'admin',
    emoji: '⚡',
    color: 'blue',
    bio: 'Workspace Admin. Manages projects, members, and requests.',
  },
  member: {
    id: 'u_member',
    name: 'maya member',
    email: 'member@lockedin.fun',
    password: 'MemberPass123!',
    role: 'member',
    emoji: '🎯',
    color: 'pink',
    bio: 'Project Member. Builds, tracks, and completes tasks.',
  },
  viewer: {
    id: 'u_viewer',
    name: 'victor viewer',
    email: 'viewer@lockedin.fun',
    password: 'ViewerPass123!',
    role: 'viewer',
    emoji: '👀',
    color: 'teal',
    bio: 'Project Viewer. Explores workspaces and can request to join.',
  },
};

const users = Object.values(MOCK_USERS);

const workspaces = [
  {
    id: 'ws_hq',
    name: 'Acme HQ',
    emoji: '🏢',
    color: 'lime',
    defaultView: 'board',
    createdAt: days(-60),
    members: [
      { userId: 'u_owner', role: 'owner', joinedAt: days(-60) },
      { userId: 'u_admin', role: 'admin', joinedAt: days(-50) },
      { userId: 'u_member', role: 'member', joinedAt: days(-30) },
      { userId: 'u_viewer', role: 'viewer', joinedAt: days(-10) },
    ],
  },
];

const projects = [
  {
    id: 'p_core',
    workspaceId: 'ws_hq',
    name: 'core platform',
    emoji: '⚡',
    color: 'blue',
    description: 'Primary product platform and backend services.',
    archived: false,
    columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
    memberIds: ['u_owner', 'u_admin', 'u_member'],
    createdAt: days(-28),
  },
  {
    id: 'p_mobile',
    workspaceId: 'ws_hq',
    name: 'mobile client',
    emoji: '📱',
    color: 'pink',
    description: 'iOS and Android client applications.',
    archived: false,
    columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
    memberIds: ['u_owner', 'u_admin'],
    createdAt: days(-14),
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
  t({
    id: 't_101',
    projectId: 'p_core',
    columnId: 'col_doing',
    title: 'Implement OAuth session handling',
    description: 'Clean tokens, multi-account sessions, and refresh flow.',
    priority: 'high',
    dueDate: days(1),
    assigneeId: 'u_member',
    labels: ['backend', 'asap'],
    createdById: 'u_admin',
    subtasks: [
      { id: 'st_1', title: 'Token validation & storage', done: true },
      { id: 'st_2', title: 'Multi-account session switcher', done: true },
      { id: 'st_3', title: 'Refresh token rotation', done: false },
    ],
  }),
  t({
    id: 't_102',
    projectId: 'p_core',
    columnId: 'col_backlog',
    title: 'Database indexing optimization',
    description: 'Query latency reduction on tasks, join requests, and log streams.',
    priority: 'medium',
    dueDate: days(5),
    assigneeId: 'u_admin',
    labels: ['backend', 'planning'],
    createdById: 'u_owner',
  }),
  t({
    id: 't_103',
    projectId: 'p_core',
    columnId: 'col_done',
    title: 'Define multi-account permission schema',
    description: 'Role-based access matrix setup and verification.',
    priority: 'urgent',
    dueDate: days(-1),
    assigneeId: 'u_owner',
    labels: ['planning'],
    createdById: 'u_owner',
    completedAt: days(-1),
  }),
  t({
    id: 't_201',
    projectId: 'p_mobile',
    columnId: 'col_next',
    title: 'Design mobile Kanban gesture animations',
    description: 'Smooth drag-and-drop between column states on touch screens.',
    priority: 'high',
    dueDate: days(2),
    assigneeId: 'u_admin',
    labels: ['design', 'frontend'],
    createdById: 'u_owner',
  }),
];

const comments = [
  {
    id: 'c_001',
    taskId: 't_101',
    authorId: 'u_admin',
    body: 'Great progress on this! Let me know when the PR is ready.',
    mentions: ['u_member'],
    createdAt: hoursAgo(6),
  },
];

const projectMessages = [
  {
    id: 'pm_001',
    projectId: 'p_core',
    authorId: 'u_admin',
    text: 'Welcome @maya member to core platform! Let us know if you have any questions about the roadmap.',
    mentions: ['u_member'],
    createdAt: hoursAgo(10),
  },
  {
    id: 'pm_002',
    projectId: 'p_core',
    authorId: 'u_member',
    text: 'Thanks @alex admin! Working on the session handling card right now.',
    mentions: ['u_admin'],
    createdAt: hoursAgo(5),
  },
];

const joinRequests = [
  {
    id: 'jr_001',
    projectId: 'p_mobile',
    userId: 'u_viewer',
    status: 'pending',
    createdAt: hoursAgo(2),
  },
];

const activity = [
  { id: 'a_001', ts: Date.now() - 3600 * 1000 * 24, actorId: 'u_owner', type: 'workspace', workspaceId: 'ws_hq', text: 'created workspace "Acme HQ"' },
  { id: 'a_002', ts: Date.now() - 3600 * 1000 * 20, actorId: 'u_admin', type: 'project', workspaceId: 'ws_hq', projectId: 'p_core', text: 'created project "core platform"' },
  { id: 'a_003', ts: Date.now() - 3600 * 1000 * 16, actorId: 'u_admin', type: 'member', workspaceId: 'ws_hq', projectId: 'p_core', text: 'added Maya Member to "core platform"' },
  { id: 'a_004', ts: Date.now() - 3600 * 1000 * 10, actorId: 'u_member', type: 'task', workspaceId: 'ws_hq', projectId: 'p_core', taskId: 't_101', text: 'started working on "Implement OAuth session handling"' },
  { id: 'a_005', ts: Date.now() - 3600 * 1000 * 2, actorId: 'u_viewer', type: 'project', workspaceId: 'ws_hq', projectId: 'p_mobile', text: 'requested to join "mobile client"' },
];

const notifications = [
  {
    id: 'n_001',
    userId: 'u_member',
    ts: Date.now() - 3600 * 1000 * 10,
    type: 'mentioned',
    text: 'Alex Admin tagged you in core platform discussion',
    read: false,
    projectId: 'p_core',
  },
  {
    id: 'n_002',
    userId: 'u_admin',
    ts: Date.now() - 3600 * 1000 * 2,
    type: 'request',
    text: 'Victor Viewer requested to join mobile client',
    read: false,
    projectId: 'p_mobile',
  },
];

export const buildSeedState = () => ({
  version: 3,
  users,
  workspaces,
  projects,
  tasks,
  comments,
  projectMessages,
  joinRequests,
});

export const buildSeedLogs = () => ({
  activity,
  notifications,
});
