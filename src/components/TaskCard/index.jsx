/* TaskCard — the kanban card. priority stripe, labels, due chip, avatar.
   works in bulk mode too. drag handlers are injected by the board. */

import { useSelector } from 'react-redux';
import { Paperclip } from 'lucide-react';
import { priorityOf, friendlyDate, isOverdue, isDueSoon, dayKey } from '@/config/global';
import { detailTaskOpened, bulkIdToggled } from '@/store/slices/uiSlice';
import { useDispatch } from 'react-redux';

export default function TaskCard({
  task,
  draggable = false,
  onDragStart,
  onDragEnd,
  dragging = false,
}) {
  const dispatch = useDispatch();
  const users = useSelector((s) => s.data.present.users);
  const project = useSelector((s) => s.data.present.projects.find((p) => p.id === task.projectId));
  const bulk = useSelector((s) => s.ui.bulk);
  const assignee = users.find((u) => u.id === task.assigneeId);

  const pri = priorityOf(task.priority);
  const doneSubs = task.subtasks.filter((st) => st.done).length;
  const overdue = !task.completedAt && isOverdue(task.dueDate);
  const today = !task.completedAt && !overdue && task.dueDate && dayKey(task.dueDate) === dayKey(new Date());

  const open = () => dispatch(detailTaskOpened(task.id));

  return (
    <article
      className={`task-card ${task.completedAt ? 'done-card' : ''} ${dragging ? 'dragging' : ''} ${bulk.active ? 'bulk-mode' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => (bulk.active ? dispatch(bulkIdToggled(task.id)) : open())}
    >
      <span className="task-card-pristripe" style={{ background: pri.color }} aria-hidden />
      {bulk.active && (
        <span className={`check bulk-check ${bulk.ids.includes(task.id) ? 'checked-demo' : ''}`} aria-hidden>
          {bulk.ids.includes(task.id) ? '✓' : ''}
        </span>
      )}
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-meta">
        {assignee ? (
          <span title={assignee.name} className="avatar" style={{ width: 22, height: 22, fontSize: 11 }}>
            <span className="avatar-block">{assignee.emoji}</span>
          </span>
        ) : (
          <span className="subtask-count" title="unassigned">⚪</span>
        )}
        {task.dueDate && (
          <span className={`due-chip ${overdue ? 'overdue' : ''} ${today ? 'today' : ''}`}>
            {overdue ? 'cooked · ' : today ? 'today · ' : ''}
            {friendlyDate(task.dueDate)}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="subtask-count">
            {doneSubs}/{task.subtasks.length}
          </span>
        )}
        {task.attachments.length > 0 && (
          <span className="subtask-count" title={`${task.attachments.length} attachment(s)`}>
            <Paperclip size={11} strokeWidth={2.5} style={{ display: 'inline' }} /> {task.attachments.length}
          </span>
        )}
      </div>
    </article>
  );
}
