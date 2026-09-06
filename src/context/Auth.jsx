/* ==========================================================================
   Auth context — multi-account authentication and session management.
   Users can log into multiple accounts simultaneously. All active sessions
   are available in the user profile dropdown.
   ========================================================================== */

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { STORAGE_KEYS, uid, isValidEmail } from '@/config/global';
import { lsGet, lsSet, lsRemove, persistState } from '@/config/persistence';
import { userAdded, userDeleted, userUpdated, userEnsureInWorkspaces } from '@/store/slices/dataSlice';
import { actorSet } from '@/store/slices/uiSlice';
import { selectUsers } from '@/store/selectors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const [activeUserIds, setActiveUserIds] = useState([]);
  const [userId, setUserId] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // restore sessions once users are loaded
  useEffect(() => {
    if (hydrated || users.length === 0) return;
    
    let savedSessions = lsGet(STORAGE_KEYS.sessions);
    let currentActive = lsGet(STORAGE_KEYS.session);

    // Validate saved sessions against loaded users
    let validSessions = Array.isArray(savedSessions)
      ? savedSessions.filter((id) => users.some((u) => u.id === id))
      : [];

    if (validSessions.length === 0) {
      // Default to the owner mock account if no session exists
      const defaultUser = users.find((u) => u.id === 'u_owner') || users[0];
      if (defaultUser) {
        validSessions = [defaultUser.id];
        currentActive = defaultUser.id;
      }
    }

    if (!validSessions.includes(currentActive)) {
      currentActive = validSessions[0] || null;
    }

    setActiveUserIds(validSessions);
    setUserId(currentActive);
    if (currentActive) {
      dispatch(actorSet(currentActive));
      lsSet(STORAGE_KEYS.session, currentActive);
    }
    lsSet(STORAGE_KEYS.sessions, validSessions);

    // Guarantee all users are in all workspaces
    users.forEach((u) => {
      dispatch(userEnsureInWorkspaces({ userId: u.id, role: u.role || 'viewer' }));
    });

    setHydrated(true);
  }, [users, hydrated, dispatch]);

  const user = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);

  const loggedInUsers = useMemo(
    () => users.filter((u) => activeUserIds.includes(u.id)),
    [users, activeUserIds]
  );

  const login = useCallback(
    async (email, password) => {
      const cleanEmail = email.trim().toLowerCase();
      const u = users.find((x) => x.email.toLowerCase() === cleanEmail);
      if (!u) throw new Error('No account found with that email.');
      if (u.password !== password) throw new Error('Incorrect password.');

      setActiveUserIds((prev) => {
        const next = prev.includes(u.id) ? prev : [...prev, u.id];
        lsSet(STORAGE_KEYS.sessions, next);
        return next;
      });

      setUserId(u.id);
      dispatch(actorSet(u.id));
      dispatch(userEnsureInWorkspaces({ userId: u.id, role: u.role || 'viewer' }));
      lsSet(STORAGE_KEYS.session, u.id);
      return u;
    },
    [users, dispatch]
  );

  const register = useCallback(
    async (name, email, password) => {
      const clean = email.trim().toLowerCase();
      if (!name.trim() || name.trim().length < 2) throw new Error('Name must be at least 2 characters.');
      if (!isValidEmail(clean)) throw new Error('Enter a valid email address.');
      if (password.length < 6) throw new Error('Password must be at least 6 characters.');
      if (users.some((u) => u.email.toLowerCase() === clean)) {
        throw new Error('Email already registered. Try logging in instead.');
      }
      const nu = {
        id: uid('u'),
        name: name.trim().toLowerCase(),
        email: clean,
        password,
        role: 'viewer', // every new user is a viewer
        emoji: '🌱',
        color: 'teal',
        bio: 'Project Viewer. Explores workspaces and can request to join.',
      };
      dispatch(userAdded(nu));
      dispatch(userEnsureInWorkspaces({ userId: nu.id, role: 'viewer' }));

      setActiveUserIds((prev) => {
        const next = [...prev, nu.id];
        lsSet(STORAGE_KEYS.sessions, next);
        return next;
      });

      setUserId(nu.id);
      dispatch(actorSet(nu.id));
      lsSet(STORAGE_KEYS.session, nu.id);
      return nu;
    },
    [users, dispatch]
  );

  // Switch between already logged-in accounts
  const switchAccount = useCallback(
    (id) => {
      if (!activeUserIds.includes(id)) {
        console.warn(`User ${id} is not currently logged in.`);
        return;
      }
      setUserId(id);
      dispatch(actorSet(id));
      const targetUser = users.find((u) => u.id === id);
      if (targetUser) {
        dispatch(userEnsureInWorkspaces({ userId: id, role: targetUser.role || 'viewer' }));
      }
      lsSet(STORAGE_KEYS.session, id);
    },
    [activeUserIds, users, dispatch]
  );

  // Backward compatible alias
  const switchUser = switchAccount;

  // Logout a specific account or the current active account
  const logout = useCallback(
    (idToLogout = null) => {
      const targetId = idToLogout || userId;
      if (!targetId) return;

      const nextSessions = activeUserIds.filter((id) => id !== targetId);
      setActiveUserIds(nextSessions);
      lsSet(STORAGE_KEYS.sessions, nextSessions);

      if (userId === targetId) {
        if (nextSessions.length > 0) {
          const nextActive = nextSessions[0];
          setUserId(nextActive);
          dispatch(actorSet(nextActive));
          lsSet(STORAGE_KEYS.session, nextActive);
        } else {
          setUserId(null);
          dispatch(actorSet(null));
          lsRemove(STORAGE_KEYS.session);
        }
      }
    },
    [activeUserIds, userId, dispatch]
  );

  const logoutAll = useCallback(() => {
    setActiveUserIds([]);
    setUserId(null);
    dispatch(actorSet(null));
    lsRemove(STORAGE_KEYS.session);
    lsRemove(STORAGE_KEYS.sessions);
  }, [dispatch]);

  const updateProfile = useCallback(
    (patch) => {
      if (!userId) return;
      dispatch(userUpdated({ id: userId, patch }));
    },
    [dispatch, userId]
  );

  const deleteAccount = useCallback(
    async (idToDelete = null) => {
      const targetId = idToDelete || userId;
      if (!targetId) return;

      // 1. Remove from Redux state
      dispatch(userDeleted({ userId: targetId }));

      // 2. Clean up any user-specific localStorage entries
      try {
        localStorage.removeItem(`lockedin-onboarded-${targetId}`);
      } catch {
        /* fine */
      }

      // 3. Remove from session lists and log out
      const nextSessions = activeUserIds.filter((id) => id !== targetId);
      setActiveUserIds(nextSessions);
      lsSet(STORAGE_KEYS.sessions, nextSessions);

      if (userId === targetId) {
        setUserId(null);
        dispatch(actorSet(null));
        lsRemove(STORAGE_KEYS.session);
      }

      if (nextSessions.length === 0) {
        lsRemove(STORAGE_KEYS.sessions);
      }

      // 4. Force immediate persistence to IndexedDB
      const storeState = window.__STORE__?.getState();
      if (storeState) {
        const remainingUsers = (storeState.data.present.users || []).filter((u) => u.id !== targetId);
        const updatedWorkspaces = (storeState.data.present.workspaces || []).map((ws) => ({
          ...ws,
          members: (ws.members || []).filter((m) => m.userId !== targetId),
        }));
        const updatedProjects = (storeState.data.present.projects || []).map((p) => ({
          ...p,
          memberIds: (p.memberIds || []).filter((id) => id !== targetId),
        }));
        await persistState({
          data: {
            ...storeState.data.present,
            users: remainingUsers,
            workspaces: updatedWorkspaces,
            projects: updatedProjects,
          },
          logs: storeState.logs,
          ui: storeState.ui,
        });
      }
    },
    [activeUserIds, userId, dispatch]
  );

  const value = useMemo(
    () => ({
      user,
      userId,
      activeUserIds,
      loggedInUsers,
      hydrated,
      login,
      register,
      logout,
      logoutAll,
      switchAccount,
      switchUser,
      updateProfile,
      deleteAccount,
    }),
    [
      user,
      userId,
      activeUserIds,
      loggedInUsers,
      hydrated,
      login,
      register,
      logout,
      logoutAll,
      switchAccount,
      switchUser,
      updateProfile,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
