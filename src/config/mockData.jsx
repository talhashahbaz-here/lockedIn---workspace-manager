/* ==========================================================================
   mock data — the fake backend. every user, workspace, project, task and
   bit of drama that ships with the app on first boot.
   password for every mock account: frfr1234 (iykyk)
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
  { id: 'u_jules', name: 'jules chen', email: 'jules@lockedin.fun', password: MOCK_PASSWORD, emoji: '🦈', color: 'lime', bio: 'the one who is actually locked in' },
  { id: 'u_zara', name: 'zara iman', email: 'zara@lockedin.fun', password: MOCK_PASSWORD, emoji: '🦋', color: 'pink', bio: 'design gworl. will critique your kerning' },
  { id: 'u_marco', name: 'marco reyes', email: 'marco@lockedin.fun', password: MOCK_PASSWORD, emoji: '🤖', color: 'blue', bio: 'backend bro. speaks fluent postgres' },
  { id: 'u_keisha', name: 'keisha ola', email: 'keisha@lockedin.fun', password: MOCK_PASSWORD, emoji: '🔥', color: 'yellow', bio: 'pm energy. owns the roadmap AND the aux' },
  { id: 'u_dan', name: 'dan park', email: 'dan@lockedin.fun', password: MOCK_PASSWORD, emoji: '🐢', color: 'lilac', bio: 'ships slow but ships' },
  { id: 'u_trent', name: 'trent smith', email: 'trent@lockedin.fun', password: MOCK_PASSWORD, emoji: '🧔', color: 'orange', bio: 'manager core. says "circling back" unironically' },
];

const workspaces = [
  {
    id: 'ws_hq',
    name: 'lockedin hq',
    emoji: '🧢',
    color: 'lime',
    defaultView: 'board',
    createdAt: days(-90),
    members: [
      { userId: 'u_jules', role: 'owner', joinedAt: days(-90) },
      { userId: 'u_marco', role: 'admin', joinedAt: days(-80) },
      { userId: 'u_keisha', role: 'member', joinedAt: days(-61) },
      { userId: 'u_zara', role: 'member', joinedAt: days(-45) },
      { userId: 'u_dan', role: 'member', joinedAt: days(-30) },
      { userId: 'u_trent', role: 'viewer', joinedAt: days(-20) },
    ],
  },
  {
    id: 'ws_side',
    name: 'side quests',
    emoji: '🎮',
    color: 'pink',
    defaultView: 'list',
    createdAt: days(-40),
    members: [
      { userId: 'u_zara', role: 'owner', joinedAt: days(-40) },
      { userId: 'u_jules', role: 'member', joinedAt: days(-39) },
      { userId: 'u_dan', role: 'viewer', joinedAt: days(-10) },
    ],
  },
];

const projects = [
  {
    id: 'p_rebrand', workspaceId: 'ws_hq', name: 'rebrand v2', emoji: '✨', color: 'pink',
    description: 'new logo, new type, new era. the glow up is real.',
    archived: false, columns: DEFAULT_COLUMNS, memberIds: ['u_jules', 'u_zara', 'u_keisha'],
    createdAt: days(-21),
  },
  {
    id: 'p_rewrite', workspaceId: 'ws_hq', name: 'app rewrite', emoji: '🏗️', color: 'blue',
    description: 'tear it down, build it better. no legacy code in this house.',
    archived: false, columns: DEFAULT_COLUMNS, memberIds: ['u_jules', 'u_marco', 'u_dan', 'u_keisha'],
    createdAt: days(-14),
  },
  {
    id: 'p_launch', workspaceId: 'ws_hq', name: 'launch week', emoji: '🚀', color: 'yellow',
    description: 'seven days. one launch. zero sleep.',
    archived: false,
    columns: [
      { id: 'col_icebox', title: 'icebox' },
      { id: 'col_upnext', title: 'up next' },
      { id: 'col_cookin', title: "cookin'" },
      { id: 'col_review', title: 'peer review' },
      { id: 'col_shipped', title: 'shipped' },
    ],
    memberIds: ['u_jules', 'u_keisha', 'u_marco', 'u_zara', 'u_dan'],
    createdAt: days(-7),
  },
  {
    id: 'p_bugs', workspaceId: 'ws_hq', name: 'bug smash (legacy)', emoji: '🐛', color: 'red',
    description: 'the old bug tracker. kept for the memories / evidence.',
    archived: true, columns: DEFAULT_COLUMNS, memberIds: ['u_marco'],
    createdAt: days(-60),
  },
  {
    id: 'p_playlist', workspaceId: 'ws_side', name: 'playlist curation', emoji: '🎧', color: 'lilac',
    description: 'the aux is a responsibility. treat it as such.',
    archived: false, columns: DEFAULT_COLUMNS, memberIds: ['u_zara', 'u_jules'],
    createdAt: days(-12),
  },
  {
    id: 'p_gym', workspaceId: 'ws_side', name: 'gym arc', emoji: '🏋️', color: 'teal',
    description: 'new year new me except it is september. commitment.',
    archived: false, columns: DEFAULT_COLUMNS, memberIds: ['u_jules', 'u_zara'],
    createdAt: days(-5),
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
  t({ id: 't_001', projectId: 'p_rebrand', columnId: 'col_shipped', title: 'pick the new wordmark', description: 'space grotesk vs archivo. fight.', priority: 'mid', dueDate: days(-3), assigneeId: 'u_zara', labels: ['design'], createdById: 'u_jules', completedAt: days(-3),
    subtasks: [{ id: 'st_1', title: 'moodboard', done: true }, { id: 'st_2', title: 'present to the group chat', done: true }] }),
  t({ id: 't_002', projectId: 'p_rebrand', columnId: 'col_cookin', title: 'design system tokens', description: 'colors, spacing, the whole personality.', priority: 'highkey', dueDate: days(1), assigneeId: 'u_zara', labels: ['design', 'feature'], createdById: 'u_jules',
    subtasks: [{ id: 'st_3', title: 'color palette', done: true }, { id: 'st_4', title: 'type scale', done: true }, { id: 'st_5', title: 'component library', done: false }] }),
  t({ id: 't_003', projectId: 'p_rebrand', columnId: 'col_upnext', title: 'rewrite the landing copy', description: 'make it hit. no corporate speak.', priority: 'mid', dueDate: days(3), assigneeId: 'u_keisha', labels: ['copy'], createdById: 'u_keisha' }),
  t({ id: 't_004', projectId: 'p_rebrand', columnId: 'col_icebox', title: 'swag merch drop', description: 'hoodies or it did not happen.', priority: 'lowkey', dueDate: null, assigneeId: null, labels: ['vibe-check'], createdById: 'u_jules' }),
  t({ id: 't_005', projectId: 'p_rebrand', columnId: 'col_upnext', title: 'logo animation for socials', description: '3 second loop. must go stupid.', priority: 'highkey', dueDate: days(-1), assigneeId: 'u_zara', labels: ['design', 'content'], createdById: 'u_keisha' }),

  // ---- app rewrite
  t({ id: 't_010', projectId: 'p_rewrite', columnId: 'col_cookin', title: 'schema migration plan', description: 'move postgres to the new shape without waking the demons.', priority: 'drop', dueDate: days(0), assigneeId: 'u_marco', labels: ['backend', 'asap'], createdById: 'u_jules',
    subtasks: [{ id: 'st_6', title: 'map old tables', done: true }, { id: 'st_7', title: 'write migrations', done: false }, { id: 'st_8', title: 'dry run on staging', done: false }] }),
  t({ id: 't_011', projectId: 'p_rewrite', columnId: 'col_cookin', title: 'component architecture', description: 'composition over config fr.', priority: 'highkey', dueDate: days(2), assigneeId: 'u_jules', labels: ['frontend'], createdById: 'u_jules' }),
  t({ id: 't_012', projectId: 'p_rewrite', columnId: 'col_upnext', title: 'auth flow rewrite', description: 'sessions, tokens, the whole ritual.', priority: 'mid', dueDate: days(5), assigneeId: 'u_marco', labels: ['backend'], createdById: 'u_marco' }),
  t({ id: 't_013', projectId: 'p_rewrite', columnId: 'col_shipped', title: 'monorepo setup', description: 'one repo to rule them all.', priority: 'mid', dueDate: days(-6), assigneeId: 'u_marco', labels: ['chore'], createdById: 'u_jules', completedAt: days(-6) }),
  t({ id: 't_014', projectId: 'p_rewrite', columnId: 'col_icebox', title: 'dark mode audit', description: 'the shadows must remain brutal.', priority: 'lowkey', dueDate: null, assigneeId: 'u_zara', labels: ['design', 'frontend'], createdById: 'u_zara' }),
  t({ id: 't_015', projectId: 'p_rewrite', columnId: 'col_upnext', title: 'api contract docs', description: 'so frontend stops guessing.', priority: 'highkey', dueDate: days(-2), assigneeId: 'u_dan', labels: ['backend', 'copy'], createdById: 'u_marco' }),
  t({ id: 't_016', projectId: 'p_rewrite', columnId: 'col_icebox', title: 'perf budget: make it snappy', description: 'if it jank, it get clanked.', priority: 'mid', dueDate: null, assigneeId: null, labels: ['frontend', 'feature'], createdById: 'u_keisha' }),

  // ---- launch week
  t({ id: 't_020', projectId: 'p_launch', columnId: 'col_cookin', title: 'freeze the feature list', description: 'nothing new goes in. on god.', priority: 'drop', dueDate: days(0), assigneeId: 'u_keisha', labels: ['asap'], createdById: 'u_keisha' }),
  t({ id: 't_021', projectId: 'p_launch', columnId: 'col_review', title: 'launch video edit', description: 'cuts on beat or we start over.', priority: 'highkey', dueDate: days(1), assigneeId: 'u_zara', labels: ['content'], createdById: 'u_keisha' }),
  t({ id: 't_022', projectId: 'p_launch', columnId: 'col_upnext', title: 'press kit + screenshots', description: 'the pretty pictures journalists actually use.', priority: 'mid', dueDate: days(2), assigneeId: 'u_zara', labels: ['design', 'content'], createdById: 'u_jules' }),
  t({ id: 't_023', projectId: 'p_launch', columnId: 'col_upnext', title: 'rollback plan (just in case)', description: 'hope for the best, script the worst.', priority: 'highkey', dueDate: days(1), assigneeId: 'u_marco', labels: ['backend', 'asap'], createdById: 'u_marco' }),
  t({ id: 't_024', projectId: 'p_launch', columnId: 'col_icebox', title: 'launch party playlist', description: 'non-negotiable. @zara owns this.', priority: 'lowkey', dueDate: days(6), assigneeId: 'u_zara', labels: ['vibe-check'], createdById: 'u_dan' }),
  t({ id: 't_025', projectId: 'p_launch', columnId: 'col_shipped', title: 'landing page wireframes', description: 'approved first try. unheard of.', priority: 'mid', dueDate: days(-4), assigneeId: 'u_zara', labels: ['design'], createdById: 'u_keisha', completedAt: days(-4) }),

  // ---- bug smash (archived)
  t({ id: 't_030', projectId: 'p_bugs', columnId: 'col_shipped', title: 'login 500 on thursdays', description: 'only thursdays. we do not know why. fixed.', priority: 'mid', dueDate: days(-50), assigneeId: 'u_marco', labels: ['bug'], createdById: 'u_marco', completedAt: days(-48) }),

  // ---- playlist curation
  t({ id: 't_040', projectId: 'p_playlist', columnId: 'col_cookin', title: 'friday focus mix', description: 'lo-fi but make it unhinged.', priority: 'lowkey', dueDate: days(2), assigneeId: 'u_zara', labels: ['vibe-check'], createdById: 'u_zara' }),
  t({ id: 't_041', projectId: 'p_playlist', columnId: 'col_icebox', title: 'gym playlist vol 3', description: 'must unlock primal energy.', priority: 'mid', dueDate: null, assigneeId: 'u_jules', labels: ['vibe-check'], createdById: 'u_jules' }),

  // ---- gym arc
  t({ id: 't_050', projectId: 'p_gym', columnId: 'col_upnext', title: 'actually go to the gym', description: 'day 1 of the arc. again.', priority: 'highkey', dueDate: days(0), assigneeId: 'u_jules', labels: ['asap'], createdById: 'u_jules' }),
  t({ id: 't_051', projectId: 'p_gym', columnId: 'col_icebox', title: 'buy protein that does not taste like chalk', description: 'the quest continues.', priority: 'mid', dueDate: days(4), assigneeId: 'u_dan', labels: ['research'], createdById: 'u_zara' }),
];

const comments = [
  { id: 'c_001', taskId: 't_002', authorId: 'u_jules', body: '@zara these tokens are clean fr. can we get the lime as primary? it slaps', mentions: ['u_zara'], createdAt: hoursAgo(26) },
  { id: 'c_002', taskId: 't_002', authorId: 'u_zara', body: 'say less. lime is the one. dropping the contrast pass today', mentions: [], createdAt: hoursAgo(22) },
  { id: 'c_003', taskId: 't_010', authorId: 'u_keisha', body: '@marco this is the drop everything one right? everyone is watching this one 👀', mentions: ['u_marco'], createdAt: hoursAgo(9) },
  { id: 'c_004', taskId: 't_010', authorId: 'u_marco', body: 'yeah yeah. migrations are written, running the dry run tonight. stay frosty', mentions: [], createdAt: hoursAgo(6) },
  { id: 'c_005', taskId: 't_021', authorId: 'u_keisha', body: 'the beat drop needs to hit at the logo reveal. non negotiable bestie', mentions: [], createdAt: hoursAgo(3) },
];

const activity = [
  { id: 'a_001', ts: hoursAgo(50), actorId: 'u_jules', type: 'project', workspaceId: 'ws_hq', projectId: 'p_rebrand', text: 'cooked up project "rebrand v2"' },
  { id: 'a_002', ts: hoursAgo(48), actorId: 'u_zara', type: 'task', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_001', text: 'spawned "pick the new wordmark"' },
  { id: 'a_003', ts: hoursAgo(47), actorId: 'u_zara', type: 'task', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_001', text: 'moved "pick the new wordmark" → shipped' },
  { id: 'a_004', ts: hoursAgo(30), actorId: 'u_jules', type: 'comment', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_002', text: 'said: "@zara these tokens are clean fr..."' },
  { id: 'a_005', ts: hoursAgo(22), actorId: 'u_zara', type: 'comment', workspaceId: 'ws_hq', projectId: 'p_rebrand', taskId: 't_002', text: 'said: "say less. lime is the one..."' },
  { id: 'a_006', ts: hoursAgo(10), actorId: 'u_marco', type: 'task', workspaceId: 'ws_hq', projectId: 'p_rewrite', taskId: 't_010', text: 'moved "schema migration plan" → cookin\'' },
  { id: 'a_007', ts: hoursAgo(9), actorId: 'u_keisha', type: 'comment', workspaceId: 'ws_hq', projectId: 'p_rewrite', taskId: 't_010', text: 'said: "@marco this is the drop everything one right?..."' },
  { id: 'a_008', ts: hoursAgo(6), actorId: 'u_marco', type: 'subtask', workspaceId: 'ws_hq', projectId: 'p_rewrite', taskId: 't_010', text: 'checked off "map old tables" in "schema migration plan"' },
  { id: 'a_009', ts: hoursAgo(5), actorId: 'u_keisha', type: 'task', workspaceId: 'ws_hq', projectId: 'p_launch', taskId: 't_020', text: 'spawned "freeze the feature list"' },
  { id: 'a_010', ts: hoursAgo(3), actorId: 'u_keisha', type: 'comment', workspaceId: 'ws_hq', projectId: 'p_launch', taskId: 't_021', text: 'said: "the beat drop needs to hit at the logo reveal..."' },
];

const notifications = [
  { id: 'n_001', userId: 'u_jules', ts: hoursAgo(26), type: 'mentioned', text: 'zara? nah — @you got mentioned: "these tokens are clean fr"', read: false, taskId: 't_002' },
  { id: 'n_002', userId: 'u_jules', ts: hoursAgo(8), type: 'due', text: '"freeze the feature list" is due today. lock in.', read: false, taskId: 't_020' },
  { id: 'n_003', userId: 'u_jules', ts: hoursAgo(30), type: 'assigned', text: 'you got assigned "component architecture". you got this fr', read: true, taskId: 't_011' },
  { id: 'n_004', userId: 'u_jules', ts: hoursAgo(60), type: 'npc', text: 'trent viewed the roadmap. that is all. he is a viewer.', read: true, taskId: null },
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
