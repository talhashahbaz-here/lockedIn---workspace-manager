# LockedIn ✳

> **lock in. ship. repeat.** — the workspace manager for people with 47 tabs open and zero finished tasks.

LockedIn is a full **workspace manager** (Notion/Jira-style) built as a **frontend-only** app: auth, real-time updates and persistence are all simulated on the client with mock data, `localStorage` and IndexedDB. No backend. No cap.

**design language:** minimal brutalism — hard 2px borders, offset shadows, zero border-radius, loud lime/pink accents, Space Grotesk + Archivo Black + Space Mono. The marketing site carries the attitude; inside the app the copy stays plain and the screens stay calm.

**stack:** Vite ⚡ React 18 ⚡ React Router 6 ⚡ Redux Toolkit ⚡ Sass

---

## run it

```bash
npm install
npm run dev      # http://localhost:5173
```

**log in instantly:** the login screen has one-tap mock profile chips, or deep-link `http://localhost:5173/login?as=u_jules`.
Password for every mock account: `frfr1234`.

Try **trent smith** (viewer) to see permission-gated UI, or switch workspaces from the sidebar to feel multi-workspace mode. New registered accounts get a two-step setup wizard (name your workspace → first project from a template).

| script | what it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run preview` | serve the build |
| `npm run lint` | eslint |
| `node scripts/smoke.mjs` | headless-browser smoke test (needs Chrome + dev server running) |

---

## keyboard shortcuts

| keys | action |
| --- | --- |
| `⌘/ctrl + K` | command palette (search everything + quick actions) |
| `/` | open palette |
| `N` | new task |
| `⌘/ctrl + Z` | undo |
| `⌘/ctrl + ⇧ + Z` | redo |
| `esc` | close modal / palette |

---

## the roster — all 70 features, 14 domains

### 🔑 auth & user *(mocked, no real backend)*
- [x] login/signup screen with fake credential check against local mock users
- [x] persisted "logged in" session via localStorage
- [x] user profile with avatar (emoji + color), name, email — editable, stored locally
- [x] multiple mock user profiles to switch between (settings → profile → quick switch)
- [x] logout clears session state (with confirm dialog)

### 🏢 workspaces
- [x] create / rename / delete workspace
- [x] switch between multiple workspaces (sidebar switcher)
- [x] workspace-level settings — name, emoji, color, default view
- [x] workspace member list (mock users assigned to it)
- [x] invite member (fake — adds a mock user to the list)

### 📦 projects
- [x] create / rename / archive / delete project within a workspace
- [x] project color + emoji tagging
- [x] project description field
- [x] project-level member assignment (subset of workspace members)
- [x] project templates — 5 presets (bug hunt, launch week, content drop, personal chaos, blank) that seed starter tasks

### ✅ tasks & subtasks
- [x] create / edit / delete task (inline composer, full composer modal, detail modal)
- [x] checklist-style subtasks
- [x] task fields: title, description, status (column), priority (low → medium → high → urgent), due date, assignee, labels
- [x] mark task / subtask complete
- [x] task detail modal (expanded view, 5 tabs)
- [x] attach files to a task — stored as base64 in state, nothing uploaded anywhere (700kb cap)
- [x] convert subtask → full task (promote) and task → subtask (demote)
- [x] duplicate task
- [x] bulk actions — multi-select → change status / assignee / delete

### 🎛️ views (same data, multiple representations)
- [ ] kanban board view with drag-and-drop between (and within) columns
- [ ] custom / reorderable kanban columns per project (add, rename, delete, drag-grip to reorder)
- [x] list / table view with sortable columns
- [x] calendar view showing tasks by due date (drag a task onto a day to reschedule)
- [x] last-used view persisted per project
- [x] group-by option in list view (assignee, status, priority, label)

### 🔎 filtering, search, sort
- [x] global search across tasks / projects / workspaces (command palette)
- [x] filter by assignee, label, priority, status, due-date range (+ free text)
- [x] sort by due date, priority, created date, alphabetical (asc/desc)
- [x] saved filter presets (per workspace, one-click apply, deletable)

### 🔐 roles & permissions (simulated client-side)
- [x] role types: owner, admin, member, viewer
- [x] permission-gated UI (viewers can't edit/delete; members can't manage projects; etc.)
- [x] role assignment per workspace member (owner-only, guarded)
- [x] "access denied" states — inline banners + disabled controls, never silent
- [x] **visibility scoping**: users only see workspaces they are a member of and projects they were added to; in aggregated views (all tasks, calendar, search, stats, activity) members and viewers see only their own assigned tasks — owners and admins see everything. project boards show the full task list to the project team. export/import are owner/admin only.

### 📜 activity log
- [x] per-task activity feed (detail modal → activity tab)
- [x] per-project feed aggregated (created, edited, moved, commented, checked off…)
- [x] timestamped entries with acting user
- [x] filterable activity log (by user, by action type, by scope) and day-grouped

### 💬 comments & collaboration (simulated)
- [x] comment thread per task
- [x] @mention autocomplete (workspace members, keyboard navigable)
- [x] edit / delete own comments
- [x] simulated "live" updates — **npc coworkers** on a random timer comment, move cards and check off subtasks, with live toasts (mutable in settings)

### ↩️ undo / redo & optimistic UX
- [x] undo/redo stack for task edits, moves, deletes — snapshot-based time travel (`⌘Z` / `⌘⇧Z`, 50 steps)
- [x] optimistic UI updates with simulated network delay + rollback on fake failure (toggleable in settings)
- [x] toast notifications with inline undo ("task deleted — undo")

### 🔔 notifications (in-app only)
- [x] notification bell with unread count (topbar + sidebar badge)
- [x] triggers: assigned to task, mentioned in comment, due date approaching (scanner), npc pings
- [x] mark as read / mark all as read / clear all
- [x] notification preferences toggle per event type

### 📴 data persistence & offline
- [x] full app state persisted to IndexedDB (state) + localStorage (session/theme)
- [x] rehydrate on reload (boot loader while it happens)
- [x] "offline" indicator via `navigator.onLine` + banner
- [x] manual "sync" button that fakes reconciling offline changes
- [x] export workspace data as JSON
- [x] import workspace data from JSON (validated — malformed files get roasted, not loaded; ids remapped on import)
- [x] reset / clear all data option (re-seeds the demo universe)

### 🧰 UI/UX utilities
- [x] command palette (⌘K) for quick navigation/actions
- [x] keyboard shortcuts (create task, undo/redo, palette, escape)
- [x] dark/light theme toggle (persisted, flash-free boot)
- [x] responsive layout (mobile drawer nav, collapsible sidebar)
- [loading skeletons] for simulated async operations
- [x] empty states for no tasks / projects / search results
- [x] confirmation dialogs for destructive actions

### ⚙️ settings
- [x] app-wide preferences (theme, default view, notification toggles, npc mode, fake network flakiness)
- [x] workspace settings page
- [x] danger zone — delete workspace / reset everything, with confirmation

---

## project structure

```
lockedin/
├── index.html                  # boot theme script + fonts
├── vite.config.js              # @ alias → src/
├── scripts/smoke.mjs           # headless browser smoke test
├── public/favicon.svg
└── src/
    ├── App.jsx                 # providers + router + offline banner
    ├── App.scss                # pulls in the design system
    ├── main.jsx                # hydrate from IDB → store → render
    ├── components/
    │   ├── Header/{index,Navbar}.jsx
    │   ├── Footer/{index,Copyright}.jsx
    │   ├── CommandPalette/     # ⌘K everything button
    │   ├── BoardView/          # kanban + dnd + column management
    │   ├── ListView/           # sortable table + group-by
    │   ├── CalendarView/       # month grid + dnd reschedule
    │   ├── TaskCard/  TaskComposer/  TaskDetail/  BulkBar/
    │   ├── FilterBar/          # filters, sort, group-by, presets
    │   ├── Modal/  ConfirmDialog/  Toaster/  Skeleton/  EmptyState/  Avatar/
    │   ├── PageNotFound.jsx  PrivateRoute.jsx  ScreenLoader.jsx
    ├── config/
    │   ├── global.jsx          # roles, permissions, priorities, templates, dates
    │   ├── mockData.jsx        # the fake universe (users, workspaces, tasks…)
    │   └── persistence.jsx     # IndexedDB + localStorage + fakeRequest + export/import
    ├── context/
    │   ├── Auth.jsx            # mock auth + session + profile switching
    │   └── AppProvider.jsx     # theme, confirm(), shortcuts, offline, npc ticker
    ├── store/
    │   ├── index.js            # store factory + effects middleware (logs, notifs, npc)
    │   ├── undo.js             # undoable() time-travel wrapper
    │   ├── state-helpers.js
    │   ├── selectors.js        # memoized reads (filters, sort, search, stats)
    │   └── slices/{dataSlice,logSlice,uiSlice}.js
    ├── pages/
    │   ├── Routes.jsx          # top-level route tree
    │   ├── Auth/{index,Login,Register,ForgotPassword}.jsx
    │   ├── Frontend/{index,Home,Todos}.jsx        # marketing site
    │   ├── Dashboard/{index,MenuItems,Routes}.jsx # app shell
    │   ├── Dashboard/Home/{index,Hero}.jsx
    │   ├── Dashboard/Projects/index.jsx
    │   ├── Dashboard/Todos/{index,All,Add,Edit}.jsx
    │   ├── Dashboard/Users/index.jsx              # members + roles + matrix
    │   ├── Dashboard/Settings/index.jsx           # profile/appearance/workspace/data/danger
    │   ├── Activity/index.jsx
    │   └── Notifications/index.jsx
    └── scss/
        ├── _bootstrap.scss     # tokens, reset, primitives (buttons, inputs, tags…)
        ├── _auth.scss  _frontend.scss  _dashboard.scss  _components.scss
        └── _screen-loader.scss
```

## how the "backend" works

- **`fakeRequest(ms, failRate)`** pretends to be a network call. Optimistic thunks apply changes instantly, then roll back from a snapshot if the fake server "ghosts" (~7% when fake latency is on).
- **effects middleware** watches every `data/*` action and writes the activity log, fires notifications (mention/assign/due), and powers the npc coworkers.
- **`undoable()`** wraps the data reducer — undoable action types push snapshots onto a past/future stack.
- **persistence** debounces the whole state into IndexedDB 400ms after any change; IndexedDB is used so base64 attachments don't blow localStorage's 5mb quota.

## notes

- everything runs client-side; refreshing never loses data (try it).
- the notification bell, `⌘K`, `N`, and `⌘Z` work from any dashboard page.
- to demo the permission system in 10 seconds: settings → profile → quick switch → *trent smith* (viewer). boards go read-only, buttons disable, banners explain why.

built with zero chill. ✳ no rights reserved.
