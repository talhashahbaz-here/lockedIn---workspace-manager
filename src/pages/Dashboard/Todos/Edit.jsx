/* Todos/Edit — deep link /app/tasks/:taskId/edit. opens the detail modal
   for the task, returns to the project when closed. */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TaskDetail from '@/components/TaskDetail';
import EmptyState from '@/components/EmptyState';
import { detailTaskOpened, detailTaskClosed } from '@/store/slices/uiSlice';

export default function Edit() {
  const { taskId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const task = useSelector((s) => s.data.present.tasks.find((t) => t.id === taskId));
  const openId = useSelector((s) => s.ui.detailTaskId);

  useEffect(() => {
    if (task) dispatch(detailTaskOpened(taskId));
    return () => dispatch(detailTaskClosed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, Boolean(task)]);

  useEffect(() => {
    if (task && !openId) navigate(`/app/project/${task.projectId}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  if (!task) {
    return (
      <div className="page">
        <EmptyState emoji="👻" title="task not found" sub="wrong id, deleted task, or the url goblin struck again.">
          <Link to="/app/tasks" className="btn btn-accent">back to tasks</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-emoji">🛠️</div>
        <h4 className="empty-title">{task.title}</h4>
        <p className="empty-sub">the task editor is open in a modal. close it to head back to the project.</p>
      </div>
      <TaskDetail />
    </div>
  );
}
