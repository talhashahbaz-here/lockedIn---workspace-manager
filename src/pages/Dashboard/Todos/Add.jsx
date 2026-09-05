/* Todos/Add — deep link /app/tasks/new. opens the composer over a minimal
   page, bounces back when done. exists so add-task is a real route. */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import TaskComposer from '@/components/TaskComposer';
import { composerOpened, composerClosed } from '@/store/slices/uiSlice';
import { selectActiveWorkspaceProjects } from '@/store/selectors';

export default function Add() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const projects = useSelector(selectActiveWorkspaceProjects);
  const open = useSelector((s) => Boolean(s.ui.composer));

  useEffect(() => {
    dispatch(composerOpened({}));
    return () => dispatch(composerClosed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // composer was closed (task created or cancelled) -> go back to tasks
    if (!open) navigate('/app/tasks', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-emoji">✍️</div>
        <h4 className="empty-title">new task</h4>
        <p className="empty-sub">
          {projects.length
            ? 'The composer should be open right now.'
            : 'Create a project first — tasks live inside projects.'}
        </p>
      </div>
      <TaskComposer />
    </div>
  );
}
