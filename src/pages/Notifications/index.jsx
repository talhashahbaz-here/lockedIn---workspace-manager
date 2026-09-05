/* Notifications — the inbox. unread states, mark read/all, click-through
   to the task, and per-event-type preferences. */

import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell, Settings2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { notificationsRead, notificationsCleared } from '@/store/slices/logSlice';
import { settingsPatched, detailTaskOpened, toastPushed } from '@/store/slices/uiSlice';
import { selectMyNotifications, selectUnreadCount, selectActorId } from '@/store/selectors';
import { timeAgo } from '@/config/global';

const TYPE_TAG = { assigned: 'tag-blue', mentioned: 'tag-pink', due: 'tag-yellow', npc: 'tag-accent' };

export default function Notifications() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifs = useSelector(selectMyNotifications);
  const unread = useSelector(selectUnreadCount);
  const actorId = useSelector(selectActorId);
  const notifPrefs = useSelector((s) => s.ui.settings.notifPrefs);

  const open = (n) => {
    dispatch(notificationsRead({ ids: [n.id], userId: actorId }));
    if (n.taskId) dispatch(detailTaskOpened(n.taskId));
  };

  const togglePref = (key) => {
    dispatch(settingsPatched({ notifPrefs: { ...notifPrefs, [key]: !notifPrefs[key] } }));
    dispatch(toastPushed({ text: `pings for "${key}" ${notifPrefs[key] ? 'off. silence.' : 'on. stay posted.'}` }));
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>notifications</h1>
          <p className="page-sub">{unread ? `${unread} unread. the pings demand attention.` : 'all caught up. unbothered. moisturized.'}</p>
        </div>
        <div className="page-actions">
          {unread > 0 && (
            <button
              type="button"
              className="btn"
              onClick={() => dispatch(notificationsRead({ all: true, userId: actorId }))}
            >
              <CheckCheck size={13} strokeWidth={2.5} /> mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={async () => {
                dispatch(notificationsCleared({ userId: actorId }));
                dispatch(toastPushed({ text: 'notification tray decluttered' }));
              }}
            >
              clear all
            </button>
          )}
        </div>
      </div>

      {notifs.length === 0 ? (
        <EmptyState
          emoji="🔕"
          title="zero notifications"
          sub="nobody needs you right now. use this time wisely (nap)."
        />
      ) : (
        <div className="notif-list">
          {notifs.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.read ? '' : 'unread'}`}
              onClick={() => open(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && open(n)}
            >
              <span className={`tag notif-type-tag ${TYPE_TAG[n.type] ?? ''}`}>{n.type}</span>
              <span className="notif-text">{n.text}</span>
              <span className="notif-time">{timeAgo(n.ts)}</span>
              {!n.read && <span className="npc-dot" title="unread" />}
            </div>
          ))}
        </div>
      )}

      <section className="home-panel">
        <div className="home-panel-head">
          <h3>🔔 ping preferences</h3>
          <span className="mono-label"><Settings2 size={12} style={{ display: 'inline' }} /> stored with your settings</span>
        </div>
        {[
          ['assigned', 'someone assigns you a task'],
          ['mentioned', 'someone @s you in a comment'],
          ['due', 'a task of yours is due soon (checked every few minutes)'],
          ['npc', 'the npc coworkers ping you with their fake updates'],
        ].map(([key, label]) => (
          <div className="settings-row" key={key}>
            <div className="settings-row-copy">
              <span className="settings-row-title">{key}</span>
              <span className="settings-row-sub">{label}</span>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={notifPrefs[key] ?? true}
              onChange={() => togglePref(key)}
            />
          </div>
        ))}
      </section>

      <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bell size={12} /> the bell in the topbar shows the same unread count. click a notification to jump to the task.
      </span>
    </div>
  );
}
