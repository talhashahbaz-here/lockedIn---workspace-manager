/* Dashboard Routes — everything under /app. guarded by the shell. */

import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Projects from './Projects';
import All from './Todos/All';
import Add from './Todos/Add';
import Edit from './Todos/Edit';
import Users from './Users';
import Settings from './Settings';
import Activity from '../Activity';
import Notifications from '../Notifications';

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<Home />} />
      <Route path="projects" element={<Projects />} />
      <Route path="project/:projectId" element={<All />} />
      <Route path="tasks" element={<All global />} />
      <Route path="tasks/new" element={<Add />} />
      <Route path="tasks/:taskId/edit" element={<Edit />} />
      <Route path="calendar" element={<All calendar />} />
      <Route path="members" element={<Users />} />
      <Route path="activity" element={<Activity />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
