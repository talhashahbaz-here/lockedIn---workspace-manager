/* PrivateRoute — no session, no dashboard. redirects to /login with a
   breadcrumb so login can send you right back. also exports the inverse
   guard for the auth pages. */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/Auth';
import ScreenLoader from './ScreenLoader';

export default function PrivateRoute({ children }) {
  const { user, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) return <ScreenLoader label="checking your creds…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export function RedirectIfAuthed({ children }) {
  const { user, hydrated } = useAuth();

  if (!hydrated) return <ScreenLoader label="checking your creds…" />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}
