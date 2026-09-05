/* Todos/index.jsx — the shared task workspace. given a project (or a global
   task set), it renders the view switcher (board/list/calendar), the filter
   bar, and the current view. used by Todos/All and the calendar page. */

import { useDispatch, useSelector } from 'react-redux';
import { Columns3, Table2, CalendarDays, Lock } from 'lucide-react';
import BoardView from '@/components/BoardView';
import ListView from '@/components/ListView';
import CalendarView from '@/components/CalendarView';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';
import { projectViewSet } from '@/store/slices/uiSlice';
import { selectUI, selectUsers, selectMyPermissions } from '@/store/selectors';

export default function TaskWorkspace({
  project = null,
  tasks,
  members,
  columns = [],
  defaultView = 'board',
}) {
  const dispatch = useDispatch();
  const { projectViews, groupBy } = useSelector(selectUI);
  const users = useSelector(selectUsers);
  const perms = useSelector(selectMyPermissions);

  const view = project ? projectViews[project.id] ?? project.defaultView ?? defaultView : defaultView;
  const setView = (v) => {
    if (project) dispatch(projectViewSet({ projectId: project.id, view: v }));
  };

  const canBoard = Boolean(project); // board needs real columns, so global views skip it

  return (
    <div className="stack-16">
      <FilterBar
        columns={columns}
        members={members}
        showGroupBy={view === 'list'}
        count={tasks.length}
        totalCount={tasks.length}
      />

      <div className="row-between row-wrap">
        <div className="view-switcher">
          {canBoard && (
            <button type="button" className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
              <Columns3 size={13} strokeWidth={2.5} /> board
            </button>
          )}
          <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <Table2 size={13} strokeWidth={2.5} /> list
          </button>
          <button type="button" className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
            <CalendarDays size={13} strokeWidth={2.5} /> calendar
          </button>
        </div>
        <span className="task-view-note">
          {view === 'board'
            ? '✳ drag cards between lanes. double-click a lane name to rename it.'
            : view === 'list'
              ? '✳ click a column header to sort. group-by lives in the filter bar.'
              : '✳ drag tasks between days to reschedule. click a day to spawn a task.'}
          {!perms.can('editTasks') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 10 }}>
              <Lock size={11} /> read-only mode ({perms.role})
            </span>
          )}
        </span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          emoji="🫙"
          title="no tasks match"
          sub="either the filters are doing too much, or this place needs tasks. you know what to do."
        />
      ) : view === 'board' && canBoard ? (
        <BoardView project={project} />
      ) : view === 'calendar' ? (
        <CalendarView tasks={tasks} users={users} />
      ) : (
        <ListView tasks={tasks} users={users} project={project} groupBy={groupBy} />
      )}
    </div>
  );
}
