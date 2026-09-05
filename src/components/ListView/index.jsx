/* ListView — sortable table + group-by. same tasks, spreadsheet energy. */

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { priorityOf, friendlyDate, isOverdue } from '@/config/global';
import { sortSet, detailTaskOpened } from '@/store/slices/uiSlice';
import { taskCheckToggled } from '@/store/state-helpers';
import { groupTasks } from '@/store/selectors';
import Avatar from '../Avatar';

export default function ListView({ tasks, users, project, columns: columnsProp = [], groupBy }) {
  const dispatch = useDispatch();
  const sort = useSelector((s) => s.ui.sort);
  const [collapsed, setCollapsed] = useState({});

  const sortArrow = (key) =>
    sort.by === key ? <span className="sort-arrow">{sort.dir === 'asc' ? '▲' : '▼'}</span> : null;

  const toggleSort = (key) =>
    dispatch(sortSet(sort.by === key ? { ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { by: key, dir: 'asc' }));

  const groups = useMemo(
    () => groupTasks(tasks, groupBy, users, project),
    [tasks, groupBy, users, project]
  );

  const columns = project?.columns ?? columnsProp;

  const renderRow = (t) => {
    const assignee = users.find((u) => u.id === t.assigneeId);
    const pri = priorityOf(t.priority);
    const overdue = !t.completedAt && isOverdue(t.dueDate);
    return (
      <tr key={t.id} onClick={() => dispatch(detailTaskOpened(t.id))}>
        <td>
          <input
            type="checkbox"
            className="check"
            checked={Boolean(t.completedAt)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => dispatch(taskCheckToggled(t))}
            title={t.completedAt ? 'reopen' : 'mark shipped'}
          />
        </td>
        <td className={`td-title ${t.completedAt ? 'done' : ''}`}>{t.title}</td>
        <td>
          <span className="tag" style={{ borderColor: 'var(--ink)', background: pri.color, color: '#141414' }}>
            {pri.label}
          </span>
        </td>
        <td>
          {assignee ? (
            <span className="row-gap-6">
              <Avatar user={assignee} size={22} /> {assignee.name.split(' ')[0]}
            </span>
          ) : (
            <span className="muted">—</span>
          )}
        </td>
        <td>
          {t.dueDate ? (
            <span className={`due-chip ${overdue ? 'overdue' : ''}`}>{friendlyDate(t.dueDate)}</span>
          ) : (
            <span className="muted">—</span>
          )}
        </td>
        <td>
          <span className="mono-label">{columns.find((c) => c.id === t.columnId)?.title ?? '?'}</span>
        </td>
        <td>
          <span className="task-card-labels">
            {t.labels.map((l) => (
              <span key={l} className="tag">{l}</span>
            ))}
          </span>
        </td>
        <td className="mono-label">{friendlyDate(t.createdAt)}</td>
      </tr>
    );
  };

  const header = (
    <tr>
      <th style={{ width: 44 }}>✓</th>
      <th className="sortable" onClick={() => toggleSort('title')}>task {sortArrow('title')}</th>
      <th className="sortable" onClick={() => toggleSort('priority')}>priority {sortArrow('priority')}</th>
      <th className="sortable" onClick={() => toggleSort('assignee')}>assignee {sortArrow('assignee')}</th>
      <th className="sortable" onClick={() => toggleSort('due')}>due {sortArrow('due')}</th>
      <th>status</th>
      <th>labels</th>
      <th className="sortable" onClick={() => toggleSort('created')}>created {sortArrow('created')}</th>
    </tr>
  );

  return (
    <div className="task-table-wrap">
      <table className="task-table">
        <thead>{header}</thead>
        <tbody>
          {groups.length === 0 && (
            <tr>
              <td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                nothing here. it is giving… zero tasks.
              </td>
            </tr>
          )}
          {groups.map((g) =>
            groupBy === 'none' ? (
              g.tasks.map(renderRow)
            ) : (
              [
                <tr key={`g-${g.key}`} className="group-header-row" style={{ background: 'var(--surface-2)' }}>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div
                      className="group-header"
                      style={{ border: 'none' }}
                      onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                    >
                      {collapsed[g.key] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      <span style={{ textTransform: 'capitalize' }}>{String(g.label ?? g.key)}</span>
                      <span className="board-col-count">{g.tasks.length}</span>
                      <span className="spacer" />
                      <ArrowUpDown size={13} style={{ opacity: 0.4 }} />
                    </div>
                  </td>
                </tr>,
                ...(collapsed[g.key] ? [] : g.tasks.map(renderRow)),
              ]
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
