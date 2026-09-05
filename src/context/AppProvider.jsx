/* ==========================================================================
   AppProvider — global app services:
   - theme application (persisted, boot-script friendly)
   - confirm() dialog as a promise
   - global keyboard shortcuts
   - offline detection
   - npc coworker ticker (simulated live activity)
   - due-soon notification scanner
   ========================================================================== */

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { STORAGE_KEYS, dayKey, isDueSoon } from '@/config/global';
import { lsGet, lsSet } from '@/config/persistence';
import { onlineSet, toastPushed, detailTaskClosed, composerOpened } from '@/store/slices/uiSlice';
import { notificationPushed } from '@/store/slices/logSlice';
import { NPC_TICK } from '@/store';
import { selectActorId, selectTasks, selectUI } from '@/store/selectors';
import { useAuth } from './Auth';
import ConfirmDialog from '@/components/ConfirmDialog';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const actorId = useSelector(selectActorId);
  const settings = useSelector((s) => s.ui.settings);
  const tasks = useSelector(selectTasks);
  const canEditTasks = useSelector((s) => {
    // shortcut availability: we do not gate strictly here, pages double-check
    return Boolean(s.ui.actorId);
  });
  const [confirmState, setConfirmState] = useState(null);

  /* --------------------------------- theme --------------------------------- */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, settings.theme);
    } catch {
      /* fine */
    }
  }, [settings.theme]);

  /* ------------------------------ confirm() -------------------------------- */
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setConfirmState({ ...options, resolve });
      }),
    []
  );
  const settleConfirm = useCallback(
    (answer) => {
      confirmState?.resolve(answer);
      setConfirmState(null);
    },
    [confirmState]
  );

  /* --------------------------- offline detection ---------------------------- */
  useEffect(() => {
    const goOnline = () => {
      dispatch(onlineSet(true));
      dispatch(toastPushed({ text: 'you are back online. we been knew you would return' }));
    };
    const goOffline = () => {
      dispatch(onlineSet(false));
      dispatch(toastPushed({ tone: 'warn', text: 'offline mode. changes are chillin locally, will sync later' }));
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    dispatch(onlineSet(navigator.onLine));
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [dispatch]);

  /* ----------------------------- npc coworker ------------------------------ */
  const npcRef = useRef(null);
  useEffect(() => {
    clearInterval(npcRef.current);
    if (!user || !settings.npcMode) return;
    const tick = () => dispatch({ type: NPC_TICK });
    const schedule = () => {
      npcRef.current = setTimeout(() => {
        tick();
        schedule();
      }, 22000 + Math.random() * 26000);
    };
    schedule();
    return () => clearTimeout(npcRef.current);
  }, [user, settings.npcMode, dispatch]);

  /* --------------------------- due-soon scanner ----------------------------- */
  const dueRef = useRef(null);
  useEffect(() => {
    if (!user || !settings.notifPrefs.due) return;
    const scan = () => {
      const seen = lsGet('lockedin-due-seen') ?? {};
      let changed = false;
      tasks.forEach((t) => {
        if (t.completedAt || t.assigneeId !== actorId || !isDueSoon(t.dueDate)) return;
        const key = `due:${t.id}:${dayKey(t.dueDate)}`;
        if (seen[key]) return;
        seen[key] = true;
        changed = true;
        dispatch(
          notificationPushed({
            id: `n_${key}`, userId: actorId, ts: Date.now(), type: 'due',
            text: `"${t.title}" is due soon. lock in.`, read: false, taskId: t.id,
          })
        );
        dispatch(toastPushed({ tone: 'warn', text: `"${t.title}" is due soon. lock in.` }));
      });
      if (changed) lsSet('lockedin-due-seen', seen);
    };
    const first = setTimeout(scan, 2500);
    dueRef.current = setInterval(scan, 5 * 60 * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(dueRef.current);
    };
  }, [user, actorId, tasks, settings.notifPrefs.due, dispatch]);

  /* --------------------------- keyboard shortcuts --------------------------- */
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target;
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

      // cmd/ctrl+k -> palette (works everywhere)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch({ type: 'ui/paletteToggled' });
        return;
      }
      // cmd/ctrl+z / cmd+shift+z -> undo/redo (not while typing)
      if (!typing && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? '@history/redo' : '@history/undo' });
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        dispatch(detailTaskClosed());
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        dispatch({ type: 'ui/paletteToggled', payload: true });
        return;
      }
      if (e.key.toLowerCase() === 'n' && user && canEditTasks) {
        e.preventDefault();
        dispatch(composerOpened({}));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, user, canEditTasks]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <AppContext.Provider value={value}>
      {children}
      {confirmState && <ConfirmDialog open onSettle={settleConfirm} {...confirmState} />}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
