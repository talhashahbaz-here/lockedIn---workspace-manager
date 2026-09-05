/* Routes — the whole route tree. public site, auth pages, guarded app. */

import { Routes, Route, Navigate } from 'react-router-dom';
import Frontend from './Frontend';
import FrontendHome from './Frontend/Home';
import FrontendTodos from './Frontend/Todos';
import Auth from './Auth';
import Login from './Auth/Login';
import Register from './Auth/Register';
import ForgotPassword from './Auth/ForgotPassword';
import Dashboard from './Dashboard';
import DashboardRoutes from './Dashboard/Routes';
import PageNotFound from '@/components/PageNotFound';
import PrivateRoute, { RedirectIfAuthed } from '@/components/PrivateRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* public marketing site */}
      <Route path="/" element={<Frontend />}>
        <Route index element={<FrontendHome />} />
        <Route path="features" element={<FrontendTodos />} />
      </Route>

      {/* auth (redirects to /app when already logged in) */}
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Auth />
          </RedirectIfAuthed>
        }
      >
        <Route index element={<Login />} />
      </Route>
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Auth />
          </RedirectIfAuthed>
        }
      >
        <Route index element={<Register />} />
      </Route>
      <Route
        path="/forgot-password"
        element={
          <RedirectIfAuthed>
            <Auth />
          </RedirectIfAuthed>
        }
      >
        <Route index element={<ForgotPassword />} />
      </Route>

      {/* the app itself */}
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      >
        <Route path="*" element={<DashboardRoutes />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}
