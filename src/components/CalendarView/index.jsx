/* CalendarView — month grid, tasks by due date, drag a task onto a day to
   reschedule it. because due dates should be draggable, obviously. */

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dayKey, priorityOf } from '@/config/global';
import { detailTaskOpened, composerOpened } from '@/store/slices/uiSlice';
import { patchTaskOptimistic } from '@/store/slices/dataSlice';
import { selectMyPermissions } from '@/store/selectors';

const DOW = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function CalendarView({ tasks, users }) {
  const dispatch = useDispatch();
  const perms = useSelector(selectMyPermissions);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [dragTask, setDragTask] = useState(null);
  const [dropKey, setDropKey] = useState(null);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startOffset = (first.getDay() + 6) % 7; // monday-first
    const start = new Date(cursor.y, cursor.m, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const k = dayKey(t.dueDate);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(t);
    });
    return map;
  }, [tasks]);

  const shift = (delta) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const todayKey = dayKey(new Date());
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dropOnDay = (date) => {
    setDropKey(null);
    if (!dragTask) return;
    dispatch(
      patchTaskOptimistic({ id: dragTask.id, patch: { dueDate: dayKey(date) } })
    );
    setDragTask(null);
  };

  return (
    <div className="stack-12">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="previous month">
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <span className="cal-title">{monthLabel}</span>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="next month">
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            const d = new Date();
            setCursor({ y: d.getFullYear(), m: d.getMonth() });
          }}
        >
          today
        </button>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn-sm btn-accent"
          onClick={() => dispatch(composerOpened({ dueDate: dayKey(new Date()) }))}
        >
          + task
        </button>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((date, i) => {
          const k = dayKey(date);
          const inMonth = date.getMonth() === cursor.m;
          const dayTasks = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          return (
            <div
              key={i}
              className={`cal-cell ${inMonth ? '' : 'outside'} ${isToday ? 'today-cell' : ''} ${dropKey === k ? 'drop-target' : ''}`}
              onClick={() => perms.can('editTasks') && dispatch(composerOpened({ dueDate: k }))}
              onDragOver={(e) => {
                if (dragTask) {
                  e.preventDefault();
                  setDropKey(k);
                }
              }}
              onDragLeave={() => setDropKey((x) => (x === k ? null : x))}
              onDrop={(e) => {
                e.preventDefault();
                dropOnDay(date);
              }}
            >
              <span className="cal-day-num">
                {date.getDate()}
                {isToday && <span className="mono-label" style={{ color: '#141414' }}>today</span>}
              </span>
              {dayTasks.slice(0, 3).map((t) => {
                const pri = priorityOf(t.priority);
                const assignee = users.find((u) => u.id === t.assigneeId);
                return (
                  <span
                    key={t.id}
                    className={`cal-task ${t.completedAt ? 'done-cal' : ''} ${dragTask?.id === t.id ? 'dragging' : ''}`}
                    style={{ borderLeft: `6px solid ${pri.color}` }}
                    draggable={perms.can('editTasks')}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDragTask(t);
                    }}
                    onDragEnd={() => setDragTask(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(detailTaskOpened(t.id));
                    }}
                    title={t.title}
                  >
                    {assignee?.emoji} {t.title}
                  </span>
                );
              })}
              {dayTasks.length > 3 && (
                <span className="mono-label">+{dayTasks.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
      <span className="mono-label">
        ✳ Drag tasks between days to reschedule. Click an empty day to add a task there.
      </span>
    </div>
  );
}
