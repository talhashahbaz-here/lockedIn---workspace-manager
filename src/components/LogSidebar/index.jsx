/* LogSidebar — real-time activity log sidebar displaying all workspace events. */

import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ScrollText } from 'lucide-react';
import { logSidebarToggled } from '@/store/slices/uiSlice';
import { selectActivity, selectUsers } from '@/store/selectors';
import Avatar from '@/components/Avatar';
import { timeAgo } from '@/config/global';

const FILTER_TYPES = [
  { id: 'all', label: 'all' },
  { id: 'task', label: 'tasks' },
  { id: 'project', label: 'projects' },
  { id: 'member', label: 'members' },
  { id: 'comment', label: 'messages' },
];

export default function LogSidebar() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.logSidebarOpen);
  const activity = useSelector(selectActivity);
  const users = useSelector(selectUsers);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return activity;
    return activity.filter((a) => a.type === filter);
  }, [activity, filter]);

  if (!open) return null;

  return (
    <aside className="log-sidebar">
      <div className="log-sidebar-head">
        <div className="log-sidebar-title-wrap">
          <ScrollText size={16} strokeWidth={2.5} />
          <span className="log-sidebar-title">Activity Log</span>
          <span className="live-dot" title="Live log stream" />
        </div>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          onClick={() => dispatch(logSidebarToggled(false))}
          title="Close log sidebar"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="log-sidebar-filters">
        {FILTER_TYPES.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filter-chip ${filter === f.id ? 'on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="log-sidebar-content">
        {filtered.length === 0 ? (
          <div className="log-empty">
            <span className="empty-emoji" style={{ fontSize: 24 }}>🪵</span>
            <p>No activity logged yet.</p>
          </div>
        ) : (
          <div className="log-stream">
            {filtered.map((entry) => {
              const actor = users.find((u) => u.id === entry.actorId);
              return (
                <div key={entry.id} className="log-item">
                  <div className="log-item-actor">
                    <Avatar user={actor} size={22} />
                  </div>
                  <div className="log-item-body">
                    <div className="log-item-header">
                      <span className="log-item-name">{actor?.name ?? 'System'}</span>
                      <span className="log-item-time">{timeAgo(entry.ts)}</span>
                    </div>
                    <div className="log-item-text">{entry.text}</div>
                    {entry.type && (
                      <span className={`tag tag-${entry.type === 'task' ? 'blue' : entry.type === 'project' ? 'pink' : entry.type === 'member' ? 'yellow' : 'accent'}`} style={{ fontSize: 9, padding: '1px 5px', marginTop: 4, display: 'inline-block' }}>
                        {entry.type}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="log-sidebar-foot">
        <span className="mono-label" style={{ fontSize: 11 }}>
          {activity.length} total event{activity.length === 1 ? '' : 's'} recorded
        </span>
      </div>
    </aside>
  );
}
