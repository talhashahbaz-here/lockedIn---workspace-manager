/* TaskComposer — the "new task" modal. spawns tasks into any project/column.
   opened via ui.composer (keyboard N, palette, board, calendar). */

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus } from 'lucide-react';
import Modal from '../Modal';
import { uid, PRIORITIES, LABEL_POOL } from '@/config/global';
import { taskAdded } from '@/store/slices/dataSlice';
import { composerClosed, toastPushed } from '@/store/slices/uiSlice';
import { selectCreatableProjects, selectCurrentWorkspace, selectActorId, selectActor } from '@/store/selectors';
import { fakeRequest } from '@/config/persistence';

export default function TaskComposer() {
  const dispatch = useDispatch();
  const composer = useSelector((s) => s.ui.composer);
  const creatableProjects = useSelector(selectCreatableProjects);
  const ws = useSelector(selectCurrentWorkspace);
  const users = useSelector((s) => s.data.present.users);
  const actorId = useSelector(selectActorId);
  const actor = useSelector(selectActor);
  const isViewer = actor?.role === 'viewer';

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!composer) return;
    const targetProject =
      creatableProjects.find((p) => p.id === composer.projectId) ?? creatableProjects[0];
    setForm({
      title: '',
      description: '',
      projectId: targetProject?.id ?? '',
      columnId: composer.columnId ?? targetProject?.columns[0]?.id ?? '',
      priority: 'medium',
      dueDate: composer.dueDate ?? '',
      assigneeId: '',
      labels: [],
    });
  }, [composer, creatableProjects]);

  const project = useMemo(
    () => creatableProjects.find((p) => p.id === form?.projectId),
    [creatableProjects, form?.projectId]
  );
  const memberUsers = useMemo(
    () => (project ? users.filter((u) => project.memberIds.includes(u.id)) : users),
    [project, users]
  );

  if (!composer || !form) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleLabel = (l) =>
    set({ labels: form.labels.includes(l) ? form.labels.filter((x) => x !== l) : [...form.labels, l] });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.projectId || !form.columnId) return;

    if (!creatableProjects.some((p) => p.id === form.projectId)) {
      dispatch(toastPushed({ tone: 'warn', text: 'You can only create tasks in projects you are a member of.' }));
      return;
    }

    dispatch(composerClosed());
    const task = {
      id: uid('t'),
      projectId: form.projectId,
      workspaceId: ws?.id,
      columnId: form.columnId,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      dueDate: form.dueDate || null,
      assigneeId: form.assigneeId || null,
      labels: form.labels,
      subtasks: [],
      attachments: [],
      createdById: actorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      order: Date.now(),
    };
    dispatch(taskAdded(task));
    dispatch(toastPushed({ text: `"${task.title}" created` }));
    // purely theatrical save indicator
    await fakeRequest(200);
  };

  if (creatableProjects.length === 0) {
    return (
      <Modal open onClose={() => dispatch(composerClosed())} eyebrow="new task" title="Cannot create tasks" width={460}>
        <div className="empty-state" style={{ padding: '24px 0', textAlign: 'center' }}>
          <div className="empty-emoji">🔒</div>
          <h4 className="empty-title">Cannot create task</h4>
          <p className="empty-sub" style={{ margin: '8px 0 20px' }}>
            {isViewer
              ? 'Viewers cannot create tasks. Request to join a project to become a member.'
              : 'You can only create tasks in projects you are a member of. Request to join a project first.'}
          </p>
          <button type="button" className="btn btn-accent" onClick={() => dispatch(composerClosed())}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={() => dispatch(composerClosed())} eyebrow="new task ✳ n" title="New task" width={620}>
      <form className="stack-16" onSubmit={submit}>
        <label className="field">
          <span className="mono-label">title *</span>
          <input
            className="input"
            autoFocus
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            required
          />
        </label>

        <label className="field">
          <span className="mono-label">description</span>
          <textarea
            className="input"
            placeholder="Add more details…"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>

        <div className="meta-grid">
          <label className="field">
            <span className="mono-label">project *</span>
            <select
              className="input select"
              value={form.projectId}
              onChange={(e) => {
                const p = creatableProjects.find((x) => x.id === e.target.value);
                set({ projectId: e.target.value, columnId: p?.columns[0]?.id ?? '', assigneeId: '' });
              }}
            >
              {creatableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="mono-label">column *</span>
            <select
              className="input select"
              value={form.columnId}
              onChange={(e) => set({ columnId: e.target.value })}
            >
              {project?.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="mono-label">priority</span>
            <select
              className="input select"
              value={form.priority}
              onChange={(e) => set({ priority: e.target.value })}
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="mono-label">assignee</span>
            <select
              className="input select"
              value={form.assigneeId}
              onChange={(e) => set({ assigneeId: e.target.value })}
            >
              <option value="">unassigned</option>
              {memberUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.emoji} {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="mono-label">due date</span>
            <input
              className="input"
              type="date"
              value={form.dueDate}
              onChange={(e) => set({ dueDate: e.target.value })}
            />
          </label>
        </div>

        <div className="field">
          <span className="mono-label">labels</span>
          <div className="filter-chips">
            {LABEL_POOL.map((l) => (
              <button
                key={l}
                type="button"
                className={`filter-chip ${form.labels.includes(l) ? 'on' : ''}`}
                onClick={() => toggleLabel(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={() => dispatch(composerClosed())}>
            Cancel
          </button>
          <button type="submit" className="btn btn-accent">
            <Plus size={15} strokeWidth={2.5} /> Create task
          </button>
        </div>
      </form>
    </Modal>
  );
}
