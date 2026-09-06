/* Settings — profile, appearance, workspace, data (export/import/sync/reset)
   and the danger zone. everything the capstone checklist ordered. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Upload, RefreshCw, Trash2, Sun, Moon, Radio } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/Auth';
import { useApp } from '@/context/AppProvider';
import { COLOR_POOL, uid } from '@/config/global';
import { downloadJSON, validateImport, idbClear } from '@/config/persistence';
import {
  settingsPatched, toastPushed, uiReset, workspaceSwitched, syncStatusSet,
} from '@/store/slices/uiSlice';
import { stateImported, workspaceDeleted, workspaceUpdated } from '@/store/slices/dataSlice';
import {
  selectCurrentWorkspace, selectMyPermissions, selectWorkspaceTasks, selectUsers,
  selectCurrentWorkspaceId,
} from '@/store/selectors';

const TABS = ['profile', 'appearance', 'workspace', 'data', 'danger'];

const PROFILE_EMOJIS = ['🦈', '🦋', '🤖', '🔥', '🐢', '🧔', '🌱', '👾', '🍄', '⚡', '🫡', '🐙'];

export default function Settings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirm } = useApp();
  const { user, updateProfile, switchUser, deleteAccount } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') ?? 'profile');
  const settings = useSelector((s) => s.ui.settings);
  const users = useSelector(selectUsers);
  const ws = useSelector(selectCurrentWorkspace);
  const perms = useSelector(selectMyPermissions);
  const isOwnerOrAdmin = perms.role === 'owner' || perms.role === 'admin' || user?.role === 'owner' || user?.role === 'admin';
  const wsId = useSelector(selectCurrentWorkspaceId);
  const wsTasks = useSelector(selectWorkspaceTasks);
  const projects = useSelector((s) => s.data.present.projects.filter((p) => p.workspaceId === s.ui.currentWorkspaceId));
  const workspaces = useSelector((s) => s.data.present.workspaces);

  const [profile, setProfile] = useState(null); // draft form
  const [wsForm, setWsForm] = useState(null);
  const fileRef = useRef(null);
  const [importReport, setImportReport] = useState(null);

  useEffect(() => {
    if (user && profile === null) {
      setProfile({ name: user.name, email: user.email, bio: user.bio, emoji: user.emoji, color: user.color });
    }
  }, [user, profile]);

  useEffect(() => {
    if (ws && wsForm === null) {
      setWsForm({ name: ws.name, emoji: ws.emoji, color: ws.color, defaultView: ws.defaultView });
    }
  }, [ws, wsForm]);

  const canManageWs = perms.can('manageWorkspace');

  /* ------------------------------ profile ---------------------------------- */
  const saveProfile = () => {
    if (!profile.name.trim()) return;
    updateProfile({
      name: profile.name.trim().toLowerCase(),
      bio: profile.bio.trim(),
      emoji: profile.emoji,
      color: profile.color,
    });
    dispatch(toastPushed({ text: 'Profile updated' }));
  };

  /* ------------------------------- export ---------------------------------- */
  const exportWorkspace = () => {
    const taskIds = new Set(wsTasks.map((t) => t.id));
    const comments = (window.__STORE__?.getState().data.present.comments ?? []).filter(
      (c) => taskIds.has(c.taskId)
    );
    downloadJSON(`lockedin-${ws?.name?.replace(/\s+/g, '-') ?? 'workspace'}.json`, {
      app: 'lockedin',
      kind: 'workspace',
      version: 1,
      exportedAt: new Date().toISOString(),
      workspace: ws,
      projects,
      tasks: wsTasks,
      comments,
    });
    dispatch(toastPushed({ text: `exported ${projects.length} project(s) + ${wsTasks.length} task(s) as json` }));
  };

  /* ------------------------------- import ---------------------------------- */
  const importJSON = async (file) => {
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      setImportReport({ ok: false, errors: ['that file is not json at all. bold move.'], summary: {} });
      return;
    }
    const report = validateImport(parsed);
    setImportReport(report);
    if (!report.ok) return;

    const ok = await confirm({
      title: 'import this workspace?',
      body: `${report.summary.projects} project(s) and ${report.summary.tasks} task(s) will be added with fresh ids. existing data stays.`,
      confirmText: 'import it', danger: false,
    });
    if (!ok) return;

    // re-id everything to avoid collisions, then splice into state
    const idMap = new Map();
    const mapId = (id) => {
      if (!idMap.has(id)) idMap.set(id, uid('x'));
      return idMap.get(id);
    };
    const newWs = {
      ...parsed.workspace,
      id: mapId(parsed.workspace.id),
      members: parsed.workspace.members.map((m) => ({ ...m, userId: users.some((u) => u.id === m.userId) ? m.userId : users[0]?.id })),
    };
    if (!newWs.members.some((m) => m.userId === user.id)) {
      newWs.members.push({ userId: user.id, role: 'owner', joinedAt: new Date().toISOString() });
    }
    const newProjects = parsed.projects.map((p) => ({ ...p, id: mapId(p.id), workspaceId: newWs.id }));
    const newTasks = parsed.tasks.map((t) => ({
      ...t,
      id: mapId(t.id),
      projectId: mapId(t.projectId),
      workspaceId: newWs.id,
      subtasks: (t.subtasks ?? []).map((st) => ({ ...st, id: mapId(st.id) })),
      attachments: (t.attachments ?? []).map((a) => ({ ...a, id: mapId(a.id) })),
    }));
    const newComments = (parsed.comments ?? []).map((c) => ({
      ...c,
      id: mapId(c.id),
      taskId: mapId(c.taskId),
    }));

    const store = window.__STORE__;
    const current = store.getState().data.present;
    dispatch(stateImported({
      ...current,
      workspaces: [...current.workspaces, newWs],
      projects: [...current.projects, ...newProjects],
      tasks: [...current.tasks, ...newTasks],
      comments: [...current.comments, ...newComments],
    }));
    dispatch(workspaceSwitched(newWs.id));
    dispatch(toastPushed({ text: 'import complete. welcome, time traveler' }));
  };

  /* -------------------------------- reset ---------------------------------- */
  const resetAll = async () => {
    const ok = await confirm({
      title: 'Reset all local data?',
      body: 'All local data is wiped and the demo data is restored. This cannot be undone.',
      confirmText: 'Reset everything',
    });
    if (!ok) return;
    await idbClear();
    try {
      localStorage.removeItem('lockedin-due-seen');
    } catch { /* fine */ }
    dispatch(uiReset({}));
    window.location.reload();
  };

  /* ---------------------------- delete account ----------------------------- */
  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: `delete account "${user?.name}"?`,
      body: 'Your account will be permanently deleted from local storage and you will be logged out. This action cannot be undone.',
      confirmText: 'delete account',
      cancelText: 'cancel',
      danger: true,
    });
    if (!ok) return;

    await deleteAccount(user?.id);
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>settings</h1>
          <p className="page-sub">Preferences for your account and workspace.</p>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'danger' ? '☠️ danger zone' : t}
            </button>
          ))}
        </nav>

        <div className="settings-panel">
          {/* ------------------------------- profile ------------------------------ */}
          {tab === 'profile' && profile && (
            <>
              <h3 style={{ fontSize: 19 }}>profile</h3>
              <div className="row-gap-6" style={{ alignItems: 'flex-start' }}>
                <Avatar user={profile} size={64} ring />
                <div className="stack-8" style={{ flex: 1 }}>
                  <div className="avatar-picker">
                    {PROFILE_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={`avatar-option ${profile.emoji === e ? 'selected' : ''}`}
                        onClick={() => setProfile({ ...profile, emoji: e })}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="avatar-picker">
                    {COLOR_POOL.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.name}
                        className={`color-option ${profile.color === c.id ? 'selected' : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => setProfile({ ...profile, color: c.id })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <label className="field">
                <span className="mono-label">name</span>
                <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </label>
              <label className="field">
                <span className="mono-label">Email (used for login — read-only)</span>
                <input className="input" value={profile.email} disabled style={{ opacity: 0.6 }} />
              </label>
              <label className="field">
                <span className="mono-label">bio</span>
                <textarea className="input" rows={2} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </label>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-accent" onClick={saveProfile}>save profile</button>
              </div>
            </>
          )}

          {/* ----------------------------- appearance ----------------------------- */}
          {tab === 'appearance' && (
            <>
              <h3 style={{ fontSize: 19 }}>appearance</h3>
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">theme</span>
                  <span className="settings-row-sub">Applies immediately and is remembered.</span>
                </div>
                <div className="row-gap-6">
                  <button
                    type="button"
                    className={`btn btn-sm ${settings.theme === 'light' ? 'btn-accent' : ''}`}
                    onClick={() => dispatch(settingsPatched({ theme: 'light' }))}
                  >
                    <Sun size={13} /> light
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${settings.theme === 'dark' ? 'btn-accent' : ''}`}
                    onClick={() => dispatch(settingsPatched({ theme: 'dark' }))}
                  >
                    <Moon size={13} /> dark
                  </button>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">default view for new projects</span>
                  <span className="settings-row-sub">where your eyes go first.</span>
                </div>
                <select
                  className="input select"
                  style={{ width: 140 }}
                  value={settings.defaultView}
                  onChange={(e) => dispatch(settingsPatched({ defaultView: e.target.value }))}
                >
                  <option value="board">board</option>
                  <option value="list">list</option>
                  <option value="calendar">calendar</option>
                </select>
              </div>
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">Simulated network failures</span>
                  <span className="settings-row-sub">Occasionally fakes a failed save so optimistic updates visibly roll back.</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={settings.fakeLatency}
                  onChange={() => dispatch(settingsPatched({ fakeLatency: !settings.fakeLatency }))}
                />
              </div>
            </>
          )}

          {/* ------------------------------ workspace ------------------------------ */}
          {tab === 'workspace' && ws && wsForm && (
            <>
              <h3 style={{ fontSize: 19 }}>workspace</h3>
              {!canManageWs && (
                <div className="access-denied">
                  🔒 your role ({perms.role}) cannot edit workspace settings. this page is decorative for you.
                </div>
              )}
              <div className="row-gap-6">
                <Avatar user={{ emoji: wsForm.emoji, color: wsForm.color }} size={54} ring />
                <div className="stack-8" style={{ flex: 1 }}>
                  <div className="avatar-picker">
                    {['🧢', '🎮', '🚀', '🏢', '🌍', '🧪', '🎨', '🛸'].map((e) => (
                      <button
                        key={e}
                        type="button"
                        className={`avatar-option ${wsForm.emoji === e ? 'selected' : ''}`}
                        onClick={() => setWsForm({ ...wsForm, emoji: e })}
                        disabled={!canManageWs}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="avatar-picker">
                    {COLOR_POOL.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`color-option ${wsForm.color === c.id ? 'selected' : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => setWsForm({ ...wsForm, color: c.id })}
                        disabled={!canManageWs}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <label className="field">
                <span className="mono-label">workspace name</span>
                <input className="input" value={wsForm.name} disabled={!canManageWs} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} />
              </label>
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">default view</span>
                  <span className="settings-row-sub">what a project opens with before you set your own.</span>
                </div>
                <select
                  className="input select"
                  style={{ width: 140 }}
                  value={wsForm.defaultView}
                  disabled={!canManageWs}
                  onChange={(e) => setWsForm({ ...wsForm, defaultView: e.target.value })}
                >
                  <option value="board">board</option>
                  <option value="list">list</option>
                  <option value="calendar">calendar</option>
                </select>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-accent"
                  disabled={!canManageWs}
                  onClick={() => {
                    dispatch(workspaceUpdated({
                      id: ws.id,
                      patch: {
                        name: wsForm.name.trim().toLowerCase() || ws.name,
                        emoji: wsForm.emoji,
                        color: wsForm.color,
                        defaultView: wsForm.defaultView,
                      },
                    }));
                    dispatch(toastPushed({ text: 'workspace settings saved' }));
                  }}
                >
                  save workspace
                </button>
              </div>
            </>
          )}

          {/* -------------------------------- data --------------------------------- */}
          {tab === 'data' && (
            <>
              <h3 style={{ fontSize: 19 }}>data & offline</h3>
              {!perms.can('exportData') && (
                <div className="access-denied">
                  🔒 Export and import are limited to owners and admins because they cover the whole workspace.
                </div>
              )}
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">Export workspace as JSON</span>
                  <span className="settings-row-sub">Downloads a JSON file with this workspace's projects, tasks and comments.</span>
                </div>
                <button type="button" className="btn" onClick={exportWorkspace} disabled={!perms.can('exportData')} title={perms.can('exportData') ? '' : 'owners and admins only'}>
                  <Download size={13} /> export
                </button>
              </div>
              <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div className="settings-row-copy">
                  <span className="settings-row-title">import workspace json</span>
                  <span className="settings-row-sub">Files are validated before anything is imported.</span>
                </div>
                <div className="row-gap-6">
                  <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
                  <button type="button" className="btn" onClick={() => fileRef.current?.click()} disabled={!perms.can('importData')} title={perms.can('importData') ? '' : 'owners and admins only'}>
                    <Upload size={13} /> pick a file
                  </button>
                  {importReport && (
                    <span className={`mono-label ${importReport.ok ? '' : 'muted'}`} style={{ color: importReport.ok ? 'var(--ink)' : 'var(--red)' }}>
                      {importReport.ok
                        ? `✅ valid: ${importReport.summary.projects} projects, ${importReport.summary.tasks} tasks`
                        : `⚠ ${importReport.errors.join(' · ')}`}
                    </span>
                  )}
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">Sync (simulated)</span>
                  <span className="settings-row-sub">Fakes a round trip to a server — useful for demoing the sync state.</span>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={async () => {
                    dispatch(syncStatusSet('syncing'));
                    await new Promise((r) => setTimeout(r, 1200));
                    dispatch(syncStatusSet('idle'));
                    dispatch(toastPushed({ text: 'Sync complete.' }));
                  }}
                >
                  <RefreshCw size={13} /> sync now
                </button>
              </div>
              <div className="settings-row">
                <div className="settings-row-copy">
                  <span className="settings-row-title">offline indicator</span>
                  <span className="settings-row-sub">Watches navigator.onLine. Go offline (DevTools → Network) to see the banner.</span>
                </div>
                <span className="tag tag-accent">automatic</span>
              </div>
              <span className="task-view-note">
                ✳ everything is persisted to IndexedDB automatically and rehydrates on reload. try refreshing right now —
                Your data is restored exactly as you left it.
              </span>
            </>
          )}

          {/* ------------------------------- danger -------------------------------- */}
          {tab === 'danger' && (
            <>
              <h3 style={{ fontSize: 19 }}>☠️ danger zone</h3>
              {isOwnerOrAdmin ? (
                <>
                  <div className="danger-zone">
                    <div className="settings-row-copy">
                      <span className="settings-row-title">delete this workspace</span>
                      <span className="settings-row-sub">
                        "{ws?.name}" and its {projects.length} project(s) + {wsTasks.length} task(s) → gone. undo toast appears,
                        but do not rely on it.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={!perms.can('deleteWorkspace')}
                      onClick={async () => {
                        const ok = await confirm({
                          title: `delete "${ws?.name}"?`,
                          body: 'Everything inside this workspace will be deleted.',
                          confirmText: 'delete workspace',
                        });
                        if (!ok) return;
                        dispatch(workspaceDeleted({ id: wsId }));
                        const next = workspaces.find((w) => w.id !== wsId);
                        if (next) dispatch(workspaceSwitched(next.id));
                        dispatch(toastPushed({ tone: 'undo', text: 'workspace deleted', action: { label: 'undo', type: '@history/undo' } }));
                        navigate('/app/projects');
                      }}
                    >
                      <Trash2 size={13} /> delete workspace
                    </button>
                    {!perms.can('deleteWorkspace') && (
                      <span className="mono-label">only owners can delete workspaces. you are {perms.role}.</span>
                    )}
                  </div>
                  <div className="danger-zone">
                    <div className="settings-row-copy">
                      <span className="settings-row-title">Reset all app data</span>
                      <span className="settings-row-sub">Wipes all local data (IndexedDB) and restores the original demo data. Your login survives.</span>
                    </div>
                    <button type="button" className="btn btn-danger" onClick={resetAll}>
                      <Trash2 size={13} /> reset everything
                    </button>
                  </div>
                </>
              ) : (
                <div className="danger-zone">
                  <div className="settings-row-copy">
                    <span className="settings-row-title">delete account</span>
                    <span className="settings-row-sub">
                      Permanently delete your account "{user?.name}" ({user?.email}) and remove your profile from all workspaces and local storage. You will be logged out immediately.
                    </span>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
                    <Trash2 size={13} /> delete account
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
