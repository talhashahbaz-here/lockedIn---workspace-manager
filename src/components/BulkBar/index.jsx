/* BulkBar — floating action bar when multi-selecting tasks. */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Trash2, ListChecks } from 'lucide-react';
import { bulkCleared, toastPushed } from '@/store/slices/uiSlice';
import { taskPatched, taskDeleted } from '@/store/slices/dataSlice';
import { selectMyPermissions, selectUsers } from '@/store/selectors';
import { useApp } from '@/context/AppProvider';
import { UNDO } from '@/store/undo';

export default function BulkBar({ project: projectProp = null }) {
  const dispatch = useDispatch();
  const { confirm } = useApp();
  const perms = useSelector(selectMyPermissions);
  const users = useSelector(selectUsers);
  const ids = useSelector((s) => s.ui.bulk.ids);
  const [status, setStatus] = useState('');
  const [assignee, setAssignee] = useState('');

  // resolve the project from the selected tasks when not given explicitly
  const project = useSelector((s) => {
    if (projectProp) return projectProp;
    const firstTask = s.data.present.tasks.find((t) => ids.includes(t.id));
    return firstTask ? s.data.present.projects.find((p) => p.id === firstTask.projectId) : null;
  });

  if (!ids.length) return null;

  const memberUsers = users.filter(
    (u) => project?.memberIds.includes(u.id)
  );

  const applyPatch = (patch) => {
    ids.forEach((id) => dispatch(taskPatched({ id, patch })));
    dispatch(toastPushed({
      tone: 'undo',
      text: `${ids.length} task(s) updated`,
      action: { label: 'undo', type: UNDO },
    }));
    dispatch(bulkCleared());
  };

  const bulkDelete = async () => {
    const ok = await confirm({
      title: `delete ${ids.length} task(s)?`,
      body: 'All selected tasks will be deleted. You can undo from the toast.',
      confirmText: 'Delete all',
    });
    if (!ok) return;
    ids.forEach((id) => dispatch(taskDeleted({ id })));
    dispatch(toastPushed({
      tone: 'undo',
      text: `${ids.length} task(s) deleted`,
      action: { label: 'undo', type: UNDO },
    }));
    dispatch(bulkCleared());
  };

  return (
    <div className="bulk-bar">
      <span className="bulk-count">
        <ListChecks size={14} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: -2 }} /> {ids.length} selected
      </span>

      {perms.can('editTasks') && (
        <>
          <select
            className="input select filter-select"
            value={status}
            onChange={(e) => {
              if (e.target.value) {
                applyPatch({ columnId: e.target.value });
                setStatus('');
              }
            }}
          >
            <option value="">set status…</option>
            {project?.columns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <select
            className="input select filter-select"
            value={assignee}
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                applyPatch({ assigneeId: v === 'none' ? null : v });
                setAssignee('');
              }
            }}
          >
            <option value="">assign to…</option>
            <option value="none">⚪ unassign</option>
            {memberUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.emoji} {u.name}</option>
            ))}
          </select>
        </>
      )}

      <button type="button" className="btn btn-sm btn-danger" onClick={bulkDelete}>
        <Trash2 size={12} strokeWidth={2.5} /> delete
      </button>
      <button type="button" className="icon-btn icon-btn-sm" title="clear selection" onClick={() => dispatch(bulkCleared())}>
        <X size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
