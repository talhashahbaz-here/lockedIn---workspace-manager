/* Dashboard — the app shell. sidebar (workspace switcher + nav), topbar
   (search, sync, undo/redo, theme, bell, user menu), routed content.
   Hosts global overlays and real-time LogSidebar.
   Multi-account sessions are fully managed from the User Profile dropdown. */

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Search, Zap, ChevronDown, Plus, Bell, LogOut, Settings as SettingsIcon,
  Sun, Moon, PanelLeftClose, PanelLeft, Menu as MenuIcon,
  UserCog, ScrollText, UserPlus, Check, KeyRound,
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
import LogSidebar from '@/components/LogSidebar';
import { useAuth } from '@/context/Auth';
import { useApp } from '@/context/AppProvider';
import { ROLE_VIBES, uid } from '@/config/global';
import {
  workspaceSwitched, mobileNavToggled, sidebarToggled, logSidebarToggled, paletteToggled,
  settingsPatched, toastPushed, workspaceAdded, workspaceUpdated,
} from '@/store/slices';
import { selectUnreadCount, selectMyRole, selectProjects, selectUI, selectCurrentWorkspace, selectActor, selectVisibleWorkspaces, selectCanCreateTasks } from '@/store/selectors';
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
  const [form, setForm] = useState({ name: '', emoji: '🏢', color: 'lime' });
  const ref = useRef(null);

  const canManageWs = role === 'owner' || role === 'admin';

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const createWorkspace = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!canManageWs) {
      dispatch(toastPushed({ tone: 'warn', text: 'Only owners and admins can create workspaces.' }));
      return;
    }
    const id = uid('ws');
    dispatch(
      workspaceAdded({
        id,
        name: form.name.trim().toLowerCase(),
        emoji: form.emoji || '🏢',
        color: form.color || 'lime',
        defaultView: 'board',
        createdAt: new Date().toISOString(),
        members: [{ userId: actor.id, role: 'owner', joinedAt: new Date().toISOString() }],
      })
    );
    dispatch(workspaceSwitched(id));
    dispatch(toastPushed({ text: `Workspace "${form.name.trim()}" created` }));
    setCreating(false);
    setForm({ name: '', emoji: '🏢', color: 'lime' });
  };

  const renameWorkspace = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !ws) return;
    dispatch(workspaceUpdated({ id: ws.id, patch: { name: form.name.trim().toLowerCase() } }));
    dispatch(toastPushed({ text: 'Workspace renamed' }));
    setEditing(false);
  };

  const leaveWorkspace = async () => {
    if (!ws) return;
    const ok = await confirm({
      title: `delete "${ws.name}"?`,
      body: 'All projects and tasks in this workspace will be deleted for everyone. This cannot be undone.',
      confirmText: 'delete workspace', danger: true,
    });
    if (!ok) return;
    const others = workspaces.filter((w) => w.id !== ws.id);
    dispatch({ type: 'data/workspaceDeleted', payload: { id: ws.id } });
    if (others.length) dispatch(workspaceSwitched(others[0].id));
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
          {ws && canManageWs && (
            <button type="button" className="ws-menu-item" onClick={() => { setEditing(true); setForm({ name: ws.name, emoji: ws.emoji, color: ws.color }); setOpen(false); }}>
              ✏️ rename current
            </button>
          )}
          {canManageWs && (
            <button type="button" className="ws-menu-item" onClick={() => { setCreating(true); setOpen(false); }}>
              ➕ new workspace
            </button>
          )}
          {ws && role === 'owner' && (
            <button type="button" className="ws-menu-item danger-item" style={{ color: 'var(--red)' }} onClick={leaveWorkspace}>
              🗑️ delete current
            </button>
          )}
          {ws && (
            <span className="mono-label" style={{ padding: '4px 10px 8px', display: 'block' }}>
              role: {role} — {ROLE_VIBES[role] ?? 'member'}
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
  const { user, loggedInUsers, switchAccount, login, logout, logoutAll } = useAuth();
  const { confirm } = useApp();
  const unread = useSelector(selectUnreadCount);
  const theme = useSelector((s) => s.ui.settings.theme);
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const logSidebarOpen = useSelector((s) => s.ui.logSidebarOpen);
  const canCreateTasks = useSelector(selectCanCreateTasks);

  const [menuOpen, setMenuOpen] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '' });
  const [addError, setAddError] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const doLogoutCurrent = async () => {
    setMenuOpen(false);
    const ok = await confirm({
      title: `log out ${user?.name}?`,
      body: loggedInUsers.length > 1
        ? 'You will switch to another active logged-in account.'
        : 'Your session ends. Your data stays safe on this device.',
      confirmText: 'log out', danger: false,
    });
    if (!ok) return;
    logout(user?.id);
    if (loggedInUsers.length <= 1) {
      navigate('/login');
    }
  };

  const doLogoutAll = async () => {
    setMenuOpen(false);
    const ok = await confirm({
      title: 'log out of all accounts?',
      body: 'All active sessions will be terminated.',
      confirmText: 'log out all', danger: true,
    });
    if (!ok) return;
    logoutAll();
    navigate('/login');
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddBusy(true);
    try {
      await login(addForm.email, addForm.password);
      dispatch(toastPushed({ text: `Logged in as ${addForm.email}` }));
      setAddAccountOpen(false);
      setAddForm({ email: '', password: '' });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddBusy(false);
    }
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
        {/* Real-time Activity Log Toggle Button */}
        <button
          type="button"
          className={`icon-btn ${logSidebarOpen ? 'active' : ''}`}
          title="Activity log sidebar"
          onClick={() => dispatch(logSidebarToggled())}
        >
          <ScrollText size={15} strokeWidth={2.5} />
        </button>

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

        {canCreateTasks && (
          <button type="button" className="btn btn-sm btn-accent" onClick={() => dispatch({ type: 'ui/composerOpened' })}>
            <Plus size={13} strokeWidth={3} /> task
          </button>
        )}

        {/* User Profile Menu & Multi-Account Switcher */}
        <div className="user-menu" ref={menuRef}>
          <button type="button" className="user-menu-trigger" onClick={() => setMenuOpen((o) => !o)}>
            <Avatar user={user} size={26} />
            <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name.split(' ')[0]}
            </span>
            <span className="tag tag-accent" style={{ fontSize: 9, padding: '1px 5px', textTransform: 'uppercase' }}>
              {user?.role || 'viewer'}
            </span>
          </button>

          {menuOpen && (
            <div className="dropdown" style={{ minWidth: 260 }}>
              <div className="dropdown-head">
                <div className="row-between">
                  <span style={{ fontWeight: 700 }}>{user?.name}</span>
                  <span className="tag tag-blue" style={{ fontSize: 10 }}>{user?.role || 'viewer'}</span>
                </div>
                <span className="dropdown-bio mono-label">{user?.email}</span>
              </div>

              {/* Multi-Account Sessions Section */}
              <div className="mono-label" style={{ padding: '8px 12px 4px', background: 'var(--bg)', borderTop: 'var(--bd)', borderBottom: 'var(--bd)' }}>
                Active Accounts ({loggedInUsers.length})
              </div>

              <div className="dropdown-accounts-list" style={{ maxHeight: 180, overflowY: 'auto' }}>
                {loggedInUsers.map((acc) => {
                  const isActive = acc.id === user?.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      className={`dropdown-item ${isActive ? 'active' : ''}`}
                      style={{ justifyContent: 'space-between' }}
                      onClick={() => {
                        if (!isActive) {
                          switchAccount(acc.id);
                          dispatch(toastPushed({ text: `Switched to ${acc.name} (${acc.role || 'viewer'})` }));
                        }
                        setMenuOpen(false);
                      }}
                    >
                      <div className="row-gap-6">
                        <Avatar user={acc} size={20} />
                        <span style={{ fontWeight: isActive ? 700 : 500 }}>{acc.name}</span>
                        <span className="mono-label" style={{ fontSize: 10 }}>({acc.role || 'viewer'})</span>
                      </div>
                      {isActive && <Check size={14} color="var(--accent-text)" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              {/* Add / Log into Another Account Button */}
              <button
                type="button"
                className="dropdown-item"
                style={{ color: 'var(--accent-text)', fontWeight: 600 }}
                onClick={() => {
                  setMenuOpen(false);
                  setAddAccountOpen(true);
                }}
              >
                <UserPlus size={14} strokeWidth={2.5} /> + Add another account
              </button>

              <div className="dropdown-sep" />

              <button type="button" className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/app/settings?tab=profile'); }}>
                <UserCog size={14} strokeWidth={2.5} /> edit profile
              </button>
              <button type="button" className="dropdown-item" onClick={() => { setMenuOpen(false); navigate('/app/settings'); }}>
                <SettingsIcon size={14} strokeWidth={2.5} /> settings
              </button>

              <div className="dropdown-sep" />

              <button type="button" className="dropdown-item danger" onClick={doLogoutCurrent}>
                <LogOut size={14} strokeWidth={2.5} /> log out this account
              </button>
              {loggedInUsers.length > 1 && (
                <button type="button" className="dropdown-item danger" onClick={doLogoutAll}>
                  <LogOut size={14} strokeWidth={2.5} /> log out all accounts
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {addAccountOpen && (
        <Modal
          open
          onClose={() => setAddAccountOpen(false)}
          eyebrow="multi-account login"
          title="Log into another account"
          width={440}
        >
          <form className="stack-16" onSubmit={handleAddAccountSubmit}>
            <p className="auth-sub" style={{ margin: 0 }}>
              Add another account to your active sessions. Passwords for mock accounts (owner, admin, member, viewer) are in <code>passwords.txt</code>.
            </p>
            {addError && <div className="auth-error">⚠ {addError}</div>}
            <label className="field">
              <span className="mono-label">email</span>
              <input
                className="input"
                type="email"
                autoFocus
                placeholder="e.g. admin@lockedin.fun"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="mono-label">password</span>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                required
              />
            </label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setAddAccountOpen(false)}>
                cancel
              </button>
              <button type="submit" className="btn btn-accent" disabled={addBusy}>
                {addBusy ? 'authenticating…' : 'Log in & Add session'}
              </button>
            </div>
            <div className="auth-alt" style={{ textAlign: 'left', fontSize: 11 }}>
              <KeyRound size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Credentials available in <strong>passwords.txt</strong> in the root folder.
            </div>
          </form>
        </Modal>
      )}
    </header>
  );
}

/* --------------------------------- sidebar ---------------------------------- */

function Sidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useSelector((s) => s.ui.mobileNavOpen);
  const unread = useSelector(selectUnreadCount);
  const actor = useSelector(selectActor);

  const NavSections = [
    { label: 'workspace', items: MENU_MAIN },
    { label: 'team', items: MENU_TEAM },
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
        <span className="mono-label" style={{ fontSize: 11 }}>
          active: <strong>{actor?.name.split(' ')[0]}</strong> ({actor?.role || 'viewer'})
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

      {/* Real-time Activity Log Sidebar */}
      <LogSidebar />

      <CommandPalette />
      <TaskComposer />
      <TaskDetail />
      <BulkBar />
      <Toaster />
    </div>
  );
}
