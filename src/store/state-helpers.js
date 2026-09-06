/* state-helpers — action creators composed of primitives. */

import { taskPatched } from './slices/dataSlice';
import { toastPushed } from './slices/uiSlice';

// toggle a task done/undone.
// A user should NOT be able to mark a task complete if not assigned to them.
export const taskCheckToggled = (task, project) => (dispatch, getState) => {
  const state = getState();
  const actorId = state.ui.actorId;
  const completing = !task.completedAt;

  if (completing && task.assigneeId !== actorId) {
    dispatch(
      toastPushed({
        tone: 'warn',
        text: 'You cannot mark a task complete unless it is assigned to you.',
      })
    );
    return;
  }

  const patch = { completedAt: completing ? new Date().toISOString() : null };
  if (completing && project) {
    const shipped = project.columns.find((c) => /shipped|done/i.test(c.title));
    if (shipped && task.columnId !== shipped.id) patch.columnId = shipped.id;
  }
  dispatch(taskPatched({ id: task.id, patch }));
};
