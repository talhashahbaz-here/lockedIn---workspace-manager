/* CommandPalette — Cmd+K. the everything button: global search across
   workspaces/projects/tasks + quick actions + navigation. arrows + enter. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Home, FolderKanban, ListChecks, CalendarDays, Activity,
  Users, Bell, Settings, Undo2, Redo2, Moon, Sun, LogOut, Radio, RefreshCw,
  CornerDownLeft, ArrowUp, ArrowDown,
} from 'lucide-react';
import { paletteToggled, composerOpened, settingsPatched, syncStatusSet } from '@/store/slices/uiSlice';
import { UNDO, REDO } from '@/store/undo';
import { globalSearch, selectUnreadCount } from '@/store/selectors';
import { useAuth } from '@/context/Auth';
import { fakeRequest } from '@/config/persistence';

export default function CommandPalette() {
  const open = useSelector((s) => s.ui.paletteOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const unread = useSelector(selectUnreadCount);
  const theme = useSelector((s) => s.ui.settings.theme);
  const npcMode = useSelector((s) => s.ui.settings.npcMode);
  const canUndo = useSelector((s) => s.data.past.length > 0);
  const canRedo = useSelector((s) => s.data.future.length > 0);

  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const close = () => dispatch(paletteToggled(false));

  const results = useMemo(() => {
    const items = [];
    const push = (section, item) => items.push({ section, ...item });

    const actions = [
      { id: 'act-task', icon: Plus, label: 'new task', hint: 'N', run: () => dispatch(composerOpened({})) },
      { id: 'act-home', icon: Home, label: 'go home', hint: '', run: () => navigate('/app/home') },
      { id: 'act-projects', icon: FolderKanban, label: 'projects', run: () => navigate('/app/projects') },
      { id: 'act-tasks', icon: ListChecks, label: 'all tasks', run: () => navigate('/app/tasks') },
      { id: 'act-cal', icon: CalendarDays, label: 'calendar', run: () => navigate('/app/calendar') },
      { id: 'act-activity', icon: Activity, label: 'activity log', run: () => navigate('/app/activity') },
      { id: 'act-members', icon: Users, label: 'members & roles', run: () => navigate('/app/members') },
      { id: 'act-notifs', icon: Bell, label: `notifications${unread ? ` (${unread} unread)` : ''}`, run: () => navigate('/app/notifications') },
      { id: 'act-settings', icon: Settings, label: 'settings', run: () => navigate('/app/settings') },
      { id: 'act-theme', icon: theme === 'light' ? Moon : Sun, label: `go ${theme === 'light' ? 'dark' : 'light'} mode`, run: () => dispatch(settingsPatched({ theme: theme === 'light' ? 'dark' : 'light' })) },
      { id: 'act-npc', icon: Radio, label: `${npcMode ? 'mute' : 'unmute'} the npc coworkers`, run: () => dispatch(settingsPatched({ npcMode: !npcMode })) },
      {
        id: 'act-sync', icon: RefreshCw, label: 'fake a sync', run: async () => {
          dispatch(syncStatusSet('syncing'));
          await fakeRequest(1400);
          dispatch(syncStatusSet('idle'));
        },
      },
      ...(canUndo ? [{ id: 'act-undo', icon: Undo2, label: 'undo', hint: '⌘Z', run: () => dispatch({ type: UNDO }) }] : []),
      ...(canRedo ? [{ id: 'act-redo', icon: Redo2, label: 'redo', hint: '⌘⇧Z', run: () => dispatch({ type: REDO }) }] : []),
      { id: 'act-logout', icon: LogOut, label: 'log out', run: () => { close(); logout(); navigate('/login'); } },
    ];
    actions.forEach((a) => push('actions', a));

    const state = window.__STORE__ ?? null;
    if (q.trim() && state) {
      const found = globalSearch(state, q);
      found.workspaces.forEach((w) =>
        push('workspaces', { id: `ws-${w.id}`, label: `${w.emoji} ${w.name}`, run: () => navigate('/app/home') })
      );
      found.projects.forEach((p) =>
        push('projects', { id: `pr-${p.id}`, label: `${p.emoji} ${p.name}`, run: () => navigate(`/app/project/${p.id}`) })
      );
      found.tasks.forEach((t) =>
        push('tasks', { id: `tk-${t.id}`, label: t.title, run: () => dispatch({ type: 'ui/detailTaskOpened', payload: t.id }) })
      );
    }

    const query = q.trim().toLowerCase();
    const filtered = query
      ? items.filter((i) => i.label.toLowerCase().includes(query))
      : items.filter((i) => i.section === 'actions');
    return filtered.slice(0, 24);
  }, [q, dispatch, navigate, unread, theme, npcMode, canUndo, canRedo, logout]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(results.length - 1, c + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[cursor];
        if (item) {
          close();
          item.run();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, results, cursor, close]);

  useEffect(() => {
    listRef.current?.querySelector('.palette-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  let lastSection = null;

  return (
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="palette">
        <div className="palette-input-row">
          <Search size={17} strokeWidth={2.5} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search everything or run a command…"
            spellCheck={false}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list" ref={listRef}>
          {results.length === 0 && (
            <div className="palette-empty mono-label">nothing found. it is giving void.</div>
          )}
          {results.map((item, i) => {
            const header = item.section !== lastSection ? item.section : null;
            lastSection = item.section;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {header && <div className="palette-section mono-label">{header}</div>}
                <button
                  type="button"
                  className={`palette-item ${i === cursor ? 'active' : ''}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => {
                    close();
                    item.run();
                  }}
                >
                  <span className="palette-item-icon">
                    <Icon size={15} strokeWidth={2.25} />
                  </span>
                  <span className="palette-item-label">{item.label}</span>
                  {item.hint && <span className="kbd">{item.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="palette-foot mono-label">
          <span><ArrowUp size={11} /><ArrowDown size={11} /> navigate</span>
          <span><CornerDownLeft size={11} /> run</span>
          <span className="palette-foot-brand">LockedIn ✳ v1.0</span>
        </div>
      </div>
    </div>
  );
}
