/* ==========================================================================
   logSlice — activity feed + in-app notifications. NOT undoable:
   history is history, even the undone parts.
   ========================================================================== */

import { createSlice } from '@reduxjs/toolkit';
import { buildSeedLogs } from '@/config/mockData';

const logSlice = createSlice({
  name: 'logs',
  initialState: buildSeedLogs(),
  reducers: {
    activityLogged(state, { payload }) {
      state.activity.unshift(payload);
      if (state.activity.length > 600) state.activity.length = 600;
    },
    notificationPushed(state, { payload }) {
      state.notifications.unshift(payload);
      if (state.notifications.length > 250) state.notifications.length = 250;
    },
    notificationsRead(state, { payload: { ids, all, userId } }) {
      state.notifications.forEach((n) => {
        if (n.userId !== userId) return;
        if (all || ids?.includes(n.id)) n.read = true;
      });
    },
    notificationsCleared(state, { payload: { userId } }) {
      state.notifications = state.notifications.filter((n) => n.userId !== userId);
    },
    logsReset() {
      return buildSeedLogs();
    },
  },
});

export const {
  activityLogged, notificationPushed, notificationsRead, notificationsCleared, logsReset,
} = logSlice.actions;

export default logSlice.reducer;
