/* state-helpers — tiny action creators composed of primitives. */

import { taskPatched } from './slices/dataSlice';

// toggle a task done/undone. when completing, nudge it to the shipped column
// if the project has one (feels correct, honestly).
export const taskCheckToggled = (task, project) => (dispatch) => {
  const completing = !task.completedAt;
  const patch = { completedAt: completing ? new Date().toISOString() : null };
  if (completing && project) {
    const shipped = project.columns.find((c) => /shipped|done/i.test(c.title));
    if (shipped && task.columnId !== shipped.id) patch.columnId = shipped.id;
  }
  dispatch(taskPatched({ id: task.id, patch }));
};
