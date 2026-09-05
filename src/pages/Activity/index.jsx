/* Activity — the workspace timeline. filterable by actor and action type,
   grouped by day. everything everyone did, receipts attached. */

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import { timeAgo } from '@/config/global';
import { selectActivity, selectUsers, selectCurrentWorkspaceId } from '@/store/selectors';

const TYPES = ['all', 'task', 'subtask', 'comment', 'project', 'member', 'workspace'];

const TYPE_TAG = {
  task: 'tag-blue',
  subtask: 'tag-blue',
  comment: 'tag-pink',
  project: 'tag-accent',
  member: 'tag-yellow',
  workspace: 'tag-yellow',
};

export default function Activity() {
  const users = useSelector(selectUsers);
  const all = useSelector(selectActivity);
  const wsId = useSelector(selectCurrentWorkspaceId);

  const [actor, setActor] = useState('all');
  const [type, setType] = useState('all');
  const [scope, setScope] = useState('workspace'); // workspace | everything

  const wsMembers = useMemo(() => {
    return new Set(
      all.filter((a) => a.workspaceId === wsId).map((a) => a.actorId)
    );
  }, [all, wsId]);

  const filtered = all
    .filter((a) => (scope === 'workspace' ? a.workspaceId === wsId : true))
    .filter((a) => (actor === 'all' ? true : a.actorId === actor))
    .filter((a) => (type === 'all' ? true : a.type === type));

  // group by day
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((a) => {
      const day = new Date(a.ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(a);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>activity</h1>
          <p className="page-sub">the group chat, but it is a work log. filter it like a detective.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          <span className="mono-label">actor</span>
          <select className="input select filter-select" value={actor} onChange={(e) => setActor(e.target.value)}>
            <option value="all">everyone</option>
            {[...wsMembers].map((id) => {
              const u = users.find((x) => x.id === id);
              return u ? (
                <option key={id} value={id}>{u.emoji} {u.name}</option>
              ) : null;
            })}
          </select>

          <span className="mono-label">type</span>
          <select className="input select filter-select" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <span className="mono-label">scope</span>
          <select className="input select filter-select" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="workspace">this workspace</option>
            <option value="everything">everything</option>
          </select>

          <span className="spacer" />
          <span className="filter-count-note">{filtered.length} event(s)</span>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState emoji="📭" title="no activity" sub="suspiciously quiet. go move a task around and come back." />
      ) : (
        <div className="stack-8">
          {groups.map(([day, items]) => (
            <div key={day}>
              <div className="mono-label activity-day-label">{day}</div>
              <div className="activity-list">
                {items.map((a) => {
                  const actorUser = users.find((u) => u.id === a.actorId);
                  return (
                    <div key={a.id} className="activity-item">
                      <Avatar user={actorUser} size={26} />
                      <span className="activity-actor">{actorUser?.name ?? 'someone'}</span>
                      <span className={`tag ${TYPE_TAG[a.type] ?? ''}`}>{a.type}</span>
                      <span className="activity-text">{a.text}</span>
                      <span className="activity-time">{timeAgo(a.ts)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
