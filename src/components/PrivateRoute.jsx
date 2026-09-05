/* PrivateRoute — no session, no dashboard. redirects to /login with a
   breadcrumb so login can send you right back. also exports the inverse
   guard for the auth pages, which honors ?as=<userId> demo deep links. */

import { useRef } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@/context/Auth';
import { selectUsers } from '@/store/selectors';
import ScreenLoader from './ScreenLoader';

export default function PrivateRoute({ children }) {
  const { user, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) return <ScreenLoader label="checking your creds…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RedirectIfAuthed({ children }) {
  const { user, hydrated, switchUser } = useAuth();
  const [params] = useSearchParams();
  const users = useSelector(selectUsers);
  const as = params.get('as');
  const doneRef = useRef(false);

  if (!hydrated) return <ScreenLoader label="checking your creds…" />;

  if (user) {
    // ?as=<userId> switches profiles even when already logged in (demo links)
    if (as && !doneRef.current) {
      const target = users.find((u) => u.id === as || u.email === as);
      if (target && target.id !== user.id) {
        doneRef.current = true;
        switchUser(target.id);
      }
    }
    return <Navigate to="/app" replace />;
  }
  return children;
}
