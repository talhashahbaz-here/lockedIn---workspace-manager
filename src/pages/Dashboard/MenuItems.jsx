/* MenuItems — sidebar navigation config. icons are lucide components. */

import {
  Home, FolderKanban, ListChecks, CalendarDays, Activity, Users, Bell, Settings,
} from 'lucide-react';

export const MENU_MAIN = [
  { to: '/app/home', label: 'home base', icon: Home },
  { to: '/app/projects', label: 'projects', icon: FolderKanban },
  { to: '/app/tasks', label: 'all tasks', icon: ListChecks },
  { to: '/app/calendar', label: 'calendar', icon: CalendarDays },
];

export const MENU_TEAM = [
  { to: '/app/members', label: 'members', icon: Users },
  { to: '/app/activity', label: 'activity', icon: Activity },
  { to: '/app/notifications', label: 'notifications', icon: Bell, badge: 'unread' },
  { to: '/app/settings', label: 'settings', icon: Settings },
];
