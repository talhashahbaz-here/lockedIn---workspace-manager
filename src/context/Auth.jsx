/* ==========================================================================
   Auth context — the mock auth. fake credential checks against local users,
   session in localStorage, profile switching so you can demo roles.
   ========================================================================== */

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { STORAGE_KEYS, uid, isValidEmail } from '@/config/global';
import { lsGet, lsSet, lsRemove } from '@/config/persistence';
import { userAdded, userUpdated } from '@/store/slices/dataSlice';
import { actorSet } from '@/store/slices/uiSlice';
import { selectUsers } from '@/store/selectors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const [userId, setUserId] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // restore session once users are loaded
  useEffect(() => {
    if (hydrated || users.length === 0) return;
    const saved = lsGet(STORAGE_KEYS.session);
    if (saved && users.some((u) => u.id === saved)) {
      setUserId(saved);
      dispatch(actorSet(saved));
    }
    setHydrated(true);
  }, [users, hydrated, dispatch]);

  const user = useMemo(() => users.find((u) => u.id === userId) ?? null, [users, userId]);

  const startSession = useCallback(
    (id) => {
      setUserId(id);
      dispatch(actorSet(id));
      lsSet(STORAGE_KEYS.session, id);
    },
    [dispatch]
  );

  const login = useCallback(
    async (email, password) => {
      const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u) throw new Error('No account found with that email.');
      if (u.password !== password) throw new Error('Incorrect password.');
      startSession(u.id);
      return u;
    },
    [users, startSession]
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
        emoji: '🌱',
        color: 'teal',
        bio: 'New to LockedIn',
      };
      dispatch(userAdded(nu));
      startSession(nu.id);
      return nu;
    },
    [users, dispatch, startSession]
  );

  const logout = useCallback(() => {
    setUserId(null);
    dispatch(actorSet(null));
    lsRemove(STORAGE_KEYS.session);
  }, [dispatch]);

  // "multi-user" simulation: hop into another mock profile
  const switchUser = useCallback(
    (id) => {
      if (!users.some((u) => u.id === id)) return;
      startSession(id);
    },
    [users, startSession]
  );

  const updateProfile = useCallback(
    (patch) => {
      if (!userId) return;
      dispatch(userUpdated({ id: userId, patch }));
    },
    [dispatch, userId]
  );

  const value = useMemo(
    () => ({ user, userId, hydrated, login, register, logout, switchUser, updateProfile }),
    [user, userId, hydrated, login, register, logout, switchUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
