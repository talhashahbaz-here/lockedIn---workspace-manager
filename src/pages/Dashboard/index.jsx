/* Dashboard — the app shell. sidebar (workspace switcher + nav), topbar
   (search, sync, undo/redo, theme, bell, user menu), routed content.
   Also hosts the global overlays: palette, composer, detail, bulk bar. */

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Search, Zap, ChevronDown, Plus, Bell, LogOut, Settings as SettingsIcon,
  Sun, Moon, PanelLeftClose, PanelLeft, Menu as MenuIcon,
  UserCog,
} from 'lucide-react';
import { MENU_MAIN, MENU_TEAM } from './MenuItems';
import DashboardRoutes from './Routes';
import CommandPalette from '@/components/CommandPalette';
import Onboarding from '@/components/Onboarding';
import TaskComposer from '@/components/TaskComposer';
import TaskDetail from '@/components/TaskDetail';
import BulkBar from '@/components/BulkBar';
import Toaster from '@/components/Toaster';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/Auth';
import { useApp } from '@/context/AppProvider';
import { ROLE_VIBES } from '@/config/global';
import { uid } from '@/config/global';
import {
  workspaceSwitched, mobileNavToggled, sidebarToggled, paletteToggled,
  settingsPatched, toastPushed, workspaceAdded, workspaceUpdated,
} from '@/store/slices';
import { selectUnreadCount, selectMyRole, selectProjects, selectUI, selectCurrentWorkspace, selectActor, selectVisibleWorkspaces } from '@/store/selectors';
import Modal from '@/components/Modal';

/* --------------------------- workspace switcher ---------------------------- */

function WorkspaceSwitcher({ collapsed }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirm } = useApp();
  const ws = useSelector(selectCurrentWorkspace);
  const projects = useSelector(selectProjects);
  const workspaces = useSelector(selectVisibleWorkspaces);
  const role = useSelector(selectMyRole);
  const actor = useSelector(selectActor);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '🧢', color: 'lime' });
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const createWorkspace = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const id = uid('ws');
    dispatch(workspaceAdded({
      id,
      name: form.name.trim().toLowerCase(),
      emoji: form.emoji,
      color: form.color,
      defaultView: 'board',
      createdAt: new Date().toISOString(),
      members: [{ userId: actor.id, role: 'owner', joinedAt: new Date().toISOString() }],
    }));
    dispatch(workspaceSwitched(id));
    setCreating(false);
    setForm({ name: '', emoji: '🧢', color: 'lime' });
    navigate('/app/projects');
    dispatch(toastPushed({ text: 'Workspace created' }));
  };

  const renameWorkspace = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !ws) return;
    dispatch(workspaceUpdated({ id: ws.id, patch: { name: form.name.trim().toLowerCase() } }));
    setEditing(false);
  };

  const leaveWorkspace = async () => {
    setOpen(false);
    if (workspaces.length <= 1) {
      dispatch(toastPushed({ tone: 'warn', text: 'You need at least one workspace.' }));
      return;
    }
    const ok = await confirm({
      title: `Delete "${ws.name}"?`,
      body: `the workspace, its ${projects.filter((p) => p.workspaceId === ws.id).length} project(s) and all their tasks will be deleted.`,
      confirmText: 'Delete workspace',
    });
    if (!ok) return;
    dispatch({ type: 'data/workspaceDeleted', payload: { id: ws.id } });
    const next = workspaces.find((w) => w.id !== ws.id);
    dispatch(workspaceSwitched(next?.id ?? null));
    dispatch(toastPushed({ tone: 'undo', text: `"${ws.name}" deleted`, action: { label: 'undo', type: '@history/undo' } }));
  };

  return (
    <div className="ws-switcher" ref={ref}>
      <button type="button" className="ws-current" onClick={() => setOpen((o) => !o)}>
        <span className="ws-emoji">{ws?.emoji ?? '❓'}</span>
        <span className="ws-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ws?.name ?? 'no workspace'}
        </span>
        <ChevronDown size={14} strokeWidth={2.5} className="ws-caret" />
      </button>

      {open && (
        <div className="ws-menu">
          <span className="mono-label" style={{ padding: '6px 10px 2px', display: 'block' }}>
            switch workspace
          </span>
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`ws-menu-item ${w.id === ws?.id ? 'active' : ''}`}
              onClick={() => {
                dispatch(workspaceSwitched(w.id));
                setOpen(false);
              }}
            >
              <span>{w.emoji}</span> {w.name}
            </button>
          ))}
          <div className="dropdown-sep" />
          {ws && (
            <button type="button" className="ws-menu-item" onClick={() => { setEditing(true); setForm({ name: ws.name, emoji: ws.emoji, color: ws.color }); setOpen(false); }}>
              ✏️ rename current
            </button>
          )}
          <button type="button" className="ws-menu-item" onClick={() => { setCreating(true); setOpen(false); }}>
            ➕ new workspace
          </button>
          {ws && (
            <button type="button" className="ws-menu-item danger-item" style={{ color: 'var(--red)' }} onClick={leaveWorkspace}>
              🗑️ delete current
            </button>
          )}
          {ws && (
            <span className="mono-label" style={{ padding: '4px 10px 8px', display: 'block' }}>
              you are: {role} — {ROLE_VIBES[role] ?? 'unknown'}
            </span>
          )}
        </div>
      )}

      {creating && (
        <Modal open onClose={() => setCreating(false)} eyebrow="new workspace" title="New workspace" width={440}>
          <form className="stack-16" onSubmit={createWorkspace}>
            <label className="field">
              <span className="mono-label">name</span>
              <input className="input" autoFocus placeholder="e.g. Acme Inc" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <div className="row-gap-6">
              <label className="field" style={{ width: 100 }}>
                <span className="mono-label">emoji</span>
                <input className="input" maxLength={2} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
              </label>
            </div>
            <button type="submit" className="btn btn-accent">create it</button>
          </form>
        </Modal>
      )}

      {editing && ws && (
        <Modal open onClose={() => setEditing(false)} eyebrow="workspace settings" title="Workspace settings" width={440}>
          <form className="stack-16" onSubmit={renameWorkspace}>
            <label className="field">
              <span className="mono-label">name</span>
              <input className="input" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <button type="submit" className="btn btn-accent">save</button>
          </form>
        </Modal>
      )}
      {collapsed && null}
    </div>
  );
}

/* --------------------------------- topbar ---------------------------------- */

function Topbar({ onBurger }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { confirm } = useApp();
  const unread = useSelector(selectUnreadCount);
  const theme = useSelector((s) => s.ui.settings.theme);
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doLogout = async () => {
    setMenuOpen(false);
    const ok = await confirm({
      title: 'log out?',
      body: 'your session ends. your data stays safe on this device.',
      confirmText: 'log out', danger: false,
    });
    if (!ok) return;
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <button type="button" className="icon-btn mobile-top-row" onClick={onBurger} aria-label="menu">
        <MenuIcon size={16} strokeWidth={2.5} />
      </button>
      <button type="button" className="icon-btn" onClick={() => dispatch(sidebarToggled())} title="collapse sidebar">
        {collapsed ? <PanelLeft size={16} strokeWidth={2.5} /> : <PanelLeftClose size={16} strokeWidth={2.5} />}
      </button>

      <button type="button" className="topbar-search" onClick={() => dispatch(paletteToggled(true))}>
        <Search size={15} strokeWidth={2.5} />
        <span className="search-text">search everything…</span>
        <span className="kbd">⌘K</span>
      </button>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-btn"
          title={`go ${theme === 'light' ? 'dark' : 'light'}`}
          onClick={() => dispatch(settingsPatched({ theme: theme === 'light' ? 'dark' : 'light' }))}
        >
          {theme === 'light' ? <Moon size={15} strokeWidth={2.5} /> : <Sun size={15} strokeWidth={2.5} />}
        </button>

        <NavLink to="/app/notifications" className="icon-btn notif-btn" title="notifications">
          <Bell size={15} strokeWidth={2.5} />
          {unread > 0 && <span className="notif-count">{unread > 99 ? '99+' : unread}</span>}
        </NavLink>

        <button type="button" className="btn btn-sm btn-accent" onClick={() => dispatch({ type: 'ui/composerOpened' })}>
          <Plus size={13} strokeWidth={3} /> task
        </button>

        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-menu-trigger" onClick={() => setMenuOpen((o) => !o)}>
            <Avatar user={user} size={26} />
            {user?.name.split(' ')[0]}
          </button>
          {menuOpen && (
            <div className="dropdown">
              <div className="dropdown-head">
                <span style={{ fontWeight: 700 }}>{user?.name}</span>
                <span className="dropdown-bio">{user?.bio}</span>
                <span className="dropdown-bio mono-label">{user?.email}</span>
              </div>
              <button type="button" className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/app/settings?tab=profile'); }}>
                <UserCog size={14} strokeWidth={2.5} /> edit profile
              </button>
              <button type="button" className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/app/settings'); }}>
                <SettingsIcon size={14} strokeWidth={2.5} /> settings
              </button>
              <div className="dropdown-sep" />
              <button type="button" className="dropdown-item danger" onClick={doLogout}>
                <LogOut size={14} strokeWidth={2.5} /> log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* --------------------------------- sidebar ---------------------------------- */

function Sidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useSelector((s) => s.ui.mobileNavOpen);
  const npcMode = useSelector((s) => s.ui.settings.npcMode);
  const unread = useSelector(selectUnreadCount);

  const NavSections = [
    { label: 'workspace', items: MENU_MAIN },
    { label: 'Team', items: MENU_TEAM },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <Link to="/app/home" className="sidebar-head">
        <span className="brand-bolt"><Zap size={16} strokeWidth={2.5} color="#141414" /></span>
        <span>LockedIn</span>
      </Link>

      <WorkspaceSwitcher collapsed={collapsed} />

      <nav className="sidebar-nav">
        {NavSections.map((section) => (
          <div key={section.label} style={{ display: 'contents' }}>
            <span className="mono-label nav-label">{section.label}</span>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => dispatch(mobileNavToggled(false))}
                title={item.label}
              >
                <item.icon size={16} strokeWidth={2.5} />
                <span>{item.label}</span>
                {item.badge === 'unread' && unread > 0 && <span className="nav-badge">{unread}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <span className="npc-pill" title={npcMode ? 'Simulated teammates active' : 'Simulated teammates muted'}>
          <span className={`npc-dot ${npcMode ? '' : 'off'}`} /> {npcMode ? 'teammates online' : 'muted'}
        </span>
        <button type="button" className="icon-btn icon-btn-sm mobile-top-row" onClick={() => dispatch(mobileNavToggled(false))} aria-label="close nav">
          ✕
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------- shell ----------------------------------- */

export default function Dashboard() {
  const dispatch = useDispatch();
  const ws = useSelector(selectCurrentWorkspace);
  const actor = useSelector(selectActor);
  const mobileOpen = useSelector(selectUI).mobileNavOpen;
  const workspaces = useSelector(selectVisibleWorkspaces);
  // if the user skipped onboarding but still has no workspace, offer a way back in
  const [restartOnboarding, setRestartOnboarding] = useState(false);
  const memberAnywhere = workspaces.length > 0;

  // make sure a (visible) workspace is always selected
  useEffect(() => {
    if (!ws && workspaces.length) {
      dispatch(workspaceSwitched(workspaces[0].id));
    }
  }, [ws, workspaces, dispatch]);

  if (actor && !memberAnywhere) {
    return (
      <div className="app-shell">
        <Onboarding key={restartOnboarding ? 'restart' : 'first'} user={actor} />
        {restartOnboarding ? null : (
          <div className="page" style={{ margin: 'auto', maxWidth: 480 }}>
            <div className="empty-state">
              <div className="empty-emoji">🫥</div>
              <h4 className="empty-title">you are not in any workspace yet</h4>
              <p className="empty-sub">it takes about 20 seconds to set up. name a space, pick a template, done.</p>
              <button type="button" className="btn btn-accent" onClick={() => setRestartOnboarding(true)}>
                set up my workspace
              </button>
            </div>
          </div>
        )}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      {mobileOpen && <div className="mobile-overlay" onClick={() => dispatch(mobileNavToggled(false))} />}
      <div className="app-main">
        <Topbar onBurger={() => dispatch(mobileNavToggled(true))} />
        <DashboardRoutes />
      </div>

      <CommandPalette />
      <TaskComposer />
      <TaskDetail />
      <BulkBar />
      <Toaster />
    </div>
  );
}
