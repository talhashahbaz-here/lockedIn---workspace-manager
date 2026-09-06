/* Projects — the grid. create (with templates), edit, archive, delete,
   assign members. permission-gated per workspace role. */

import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, Pencil, Trash2, Settings2 } from 'lucide-react';
import Modal from '@/components/Modal';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import {
  uid, COLOR_POOL, PROJECT_TEMPLATES, can as roleCan, DEFAULT_COLUMNS,
} from '@/config/global';
import {
  projectAdded, projectUpdated, projectArchived, projectDeleted, projectMembersToggled,
} from '@/store/slices/dataSlice';
import { toastPushed } from '@/store/slices/uiSlice';
import {
  selectActiveWorkspaceProjects, selectWorkspaceProjects,
  selectCurrentWorkspaceId, selectUsers, selectMyPermissions, selectWorkspaceTasks, selectActorId,
} from '@/store/selectors';
import { useApp } from '@/context/AppProvider';

/* --------------------------- project form modal ---------------------------- */

function ProjectForm({ initial, onClose }) {
  const dispatch = useDispatch();
  const wsId = useSelector(selectCurrentWorkspaceId);
  const ws = useSelector((s) => s.data.present.workspaces.find((w) => w.id === wsId));
  const users = useSelector(selectUsers);
  const wsMembers = users.filter((u) => ws?.members.some((m) => m.userId === u.id));
  const isEdit = Boolean(initial);

  const [form, setForm] = useState(
    initial ?? { name: '', emoji: '📦', color: 'lime', description: '', templateId: 'blank', memberIds: [] }
  );

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleMember = (id) =>
    set({ memberIds: form.memberIds.includes(id) ? form.memberIds.filter((x) => x !== id) : [...form.memberIds, id] });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (isEdit) {
      dispatch(projectUpdated({
        id: initial.id,
        patch: {
          name: form.name.trim().toLowerCase(),
          emoji: form.emoji,
          color: form.color,
          description: form.description.trim(),
        },
      }));
      // sync member assignments (only additions/removals)
      initial.memberIds.forEach((id) => {
        if (!form.memberIds.includes(id)) dispatch(projectMembersToggled({ id: initial.id, userId: id }));
      });
      form.memberIds.forEach((id) => {
        if (!initial.memberIds.includes(id)) dispatch(projectMembersToggled({ id: initial.id, userId: id }));
      });
      dispatch(toastPushed({ text: 'Project updated' }));
      onClose();
      return;
    }

    const template = PROJECT_TEMPLATES.find((t) => t.id === form.templateId);
    const id = uid('p');
    const now = new Date().toISOString();
    dispatch(
      projectAdded({
        id,
        workspaceId: wsId,
        name: form.name.trim().toLowerCase(),
        emoji: form.emoji,
        color: form.color,
        description: form.description.trim(),
        archived: false,
        columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
        memberIds: form.memberIds,
        createdAt: now,
        _seedTasks: template.tasks.map((t, i) => ({
          id: uid('t'),
          projectId: id,
          workspaceId: wsId,
          columnId: 'col_icebox',
          title: t.title,
          description: `from the "${template.name}" template`,
          priority: t.priority ?? 'medium',
          dueDate: null,
          assigneeId: null,
          labels: t.labels ?? [],
          subtasks: [],
          attachments: [],
          createdById: null,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
          order: i,
        })),
      })
    );
    dispatch(toastPushed({ text: `"${form.name.trim()}" created${template.tasks.length ? ` with ${template.tasks.length} starter tasks` : ''}` }));
    onClose();
  };

  return (
    <Modal open onClose={onClose} width={620} eyebrow={isEdit ? 'edit project' : 'new project'} title={isEdit ? 'Edit project' : 'New project'}>
      <form className="stack-16" onSubmit={submit}>
        <div className="row-gap-6">
          <label className="field" style={{ width: 92 }}>
            <span className="mono-label">emoji</span>
            <input className="input" maxLength={2} value={form.emoji} onChange={(e) => set({ emoji: e.target.value })} />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span className="mono-label">name *</span>
            <input className="input" autoFocus placeholder="q3 world domination" value={form.name} onChange={(e) => set({ name: e.target.value })} required />
          </label>
        </div>

        <label className="field">
          <span className="mono-label">description</span>
          <textarea className="input" rows={2} placeholder="what is the mission" value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </label>

        <div className="field">
          <span className="mono-label">color</span>
          <div className="avatar-picker">
            {COLOR_POOL.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                className={`color-option ${form.color === c.id ? 'selected' : ''}`}
                style={{ background: c.hex }}
                onClick={() => set({ color: c.id })}
              />
            ))}
          </div>
        </div>

        {!isEdit && (
          <div className="field">
            <span className="mono-label">start from a template</span>
            <div className="stack-8">
              {PROJECT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`mini-task ${form.templateId === t.id ? 'template-on' : ''}`}
                  style={form.templateId === t.id ? { boxShadow: '3px 3px 0 var(--shadow-ink)', background: 'var(--accent)' } : undefined}
                  onClick={() => set({ templateId: t.id })}
                >
                  <span style={{ fontSize: 17 }}>{t.emoji}</span>
                  <span className="stack-4" style={{ textAlign: 'left', flex: 1 }}>
                    <b>{t.name}</b>
                    <span className="mono-label">{t.description}</span>
                  </span>
                  <span className="board-col-count">{t.tasks.length} tasks</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <span className="mono-label">members (subset of the workspace)</span>
          <div className="filter-chips">
            {wsMembers.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`filter-chip ${form.memberIds.includes(u.id) ? 'on' : ''}`}
                onClick={() => toggleMember(u.id)}
              >
                {u.emoji} {u.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>nah</button>
          <button type="submit" className="btn btn-accent">{isEdit ? 'save changes' : 'create project'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* --------------------------------- the page -------------------------------- */

export default function Projects() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirm } = useApp();
  const perms = useSelector(selectMyPermissions);
  const actorId = useSelector(selectActorId);
  const active = useSelector(selectActiveWorkspaceProjects);
  const all = useSelector(selectWorkspaceProjects);
  const users = useSelector(selectUsers);
  const wsTasks = useSelector(selectWorkspaceTasks);
  const [showArchived, setShowArchived] = useState(false);
  const [formFor, setFormFor] = useState(null); // null | 'new' | project

  const shown = showArchived ? all : active;
  const counts = useMemo(() => {
    const map = new Map();
    wsTasks.forEach((t) => map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1));
    return map;
  }, [wsTasks]);

  const toggleArchive = async (p) => {
    if (p.archived) {
      dispatch(projectArchived({ id: p.id, archived: false }));
      dispatch(toastPushed({ text: `"${p.name}" restored` }));
      return;
    }
    const ok = await confirm({
      title: `archive "${p.name}"?`,
      body: 'Archived projects become read-only and are hidden from the main list. You can restore them anytime.',
      confirmText: 'archive it', danger: false,
    });
    if (ok) {
      dispatch(projectArchived({ id: p.id, archived: true }));
      dispatch(toastPushed({ tone: 'undo', text: `"${p.name}" archived`, action: { label: 'undo', type: '@history/undo' } }));
    }
  };

  const remove = async (p) => {
    const taskCount = counts.get(p.id) ?? 0;
    const ok = await confirm({
      title: `delete "${p.name}"?`,
      body: `${taskCount} task(s) and all comments will be deleted. This cannot be undone.`,
      confirmText: 'delete forever',
    });
    if (ok) {
      dispatch(projectDeleted({ id: p.id }));
      dispatch(toastPushed({ tone: 'undo', text: `"${p.name}" deleted`, action: { label: 'undo', type: '@history/undo' } }));
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>projects</h1>
          <p className="page-sub">Group your work into projects.</p>
        </div>
        <div className="page-actions">
          <button type="button" className={`btn ${showArchived ? 'btn-ink' : ''}`} onClick={() => setShowArchived((v) => !v)}>
            <Archive size={13} strokeWidth={2.5} /> {showArchived ? 'hiding archive' : 'show archive'}
          </button>
          {perms.can('createProjects') && (
            <button type="button" className="btn btn-accent" onClick={() => setFormFor('new')}>
              <Plus size={14} strokeWidth={2.5} /> new project
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          emoji={showArchived ? '🗃️' : '📭'}
          title={showArchived ? 'the archive is empty' : 'no projects yet'}
          sub={showArchived ? 'No archived projects.' : 'Create your first project, pick a template, and assign members.'}
        >
          {!showArchived && perms.can('createProjects') && (
            <button type="button" className="btn btn-accent" onClick={() => setFormFor('new')}>
              <Plus size={14} strokeWidth={2.5} /> new project
            </button>
          )}
        </EmptyState>
      ) : (
        <div className="project-grid">
          {shown.map((p) => {
            const hex = COLOR_POOL.find((c) => c.id === p.color)?.hex ?? 'var(--accent)';
            const members = users.filter((u) => p.memberIds.includes(u.id));
            return (
              <article key={p.id} className={`project-card ${p.archived ? 'archived' : ''}`}>
                <div className="project-card-strip" style={{ background: hex }} />
                <div className="project-card-body">
                  <button
                    type="button"
                    className="project-card-title"
                    style={{ background: 'none', textAlign: 'left' }}
                    onClick={() => navigate(`/app/project/${p.id}`)}
                  >
                    <span style={{ fontSize: 22 }}>{p.emoji}</span>
                    {p.name}
                  </button>
                  <p className="project-card-desc">{p.description || 'no description. mysterious.'}</p>
                  <div className="row-gap-6">
                    <span className="board-col-count">{counts.get(p.id) ?? 0} tasks</span>
                    <span className="board-col-count">{p.columns.length} lanes</span>
                    {p.archived && <span className="tag tag-red">archived</span>}
                    {p.memberIds.includes(actorId) ? (
                      <span className="tag tag-blue">member</span>
                    ) : (
                      <span className="tag tag-yellow">viewer</span>
                    )}
                  </div>
                  <div className="project-card-meta">
                    <span className="project-avatars">
                      {members.slice(0, 5).map((u) => (
                        <Avatar key={u.id} user={u} size={26} />
                      ))}
                    </span>
                    <span className="spacer" />
                    {perms.can('manageProjects') && (
                      <span className="row-gap-6">
                        <button type="button" className="icon-btn icon-btn-sm" title="edit project" onClick={() => setFormFor(p)}>
                          <Pencil size={11} strokeWidth={2.5} />
                        </button>
                        <button type="button" className="icon-btn icon-btn-sm" title={p.archived ? 'restore' : 'archive'} onClick={() => toggleArchive(p)}>
                          {p.archived ? <ArchiveRestore size={11} strokeWidth={2.5} /> : <Archive size={11} strokeWidth={2.5} />}
                        </button>
                        <button type="button" className="icon-btn icon-btn-sm" title="delete project" onClick={() => remove(p)}>
                          <Trash2 size={11} strokeWidth={2.5} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!perms.can('manageProjects') && (
        <div className="access-denied">
          🔒 As a <b>{perms.role}</b>, you have read-only overview access. Only owners and admins can create, edit, or delete projects. Viewers can request to join projects to work on tasks.
        </div>
      )}

      {formFor && (
        <ProjectForm initial={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} />
      )}
    </div>
  );
}
