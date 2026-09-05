/* TaskDetail — the expanded task view. every field, subtasks, attachments,
   comments with @mentions, per-task activity, and the conversion tricks. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Check, Plus, Trash2, Copy, ArrowUpRight, ArrowDownRight, Paperclip, X, Send, Pencil,
} from 'lucide-react';
import Modal from '../Modal';
import Avatar from '../Avatar';
import { uid, PRIORITIES, friendlyDate, timeAgo, toDateInputValue } from '@/config/global';
import {
  taskPatched, taskDeleted, deleteTaskOptimistic, taskDuplicated,
  subtaskAdded, subtaskDeleted, subtaskToggled, subtaskRenamed,
  subtaskPromoted, taskDemoted, attachmentAdded, attachmentRemoved,
  commentAdded, commentUpdated, commentDeleted,
} from '@/store/slices/dataSlice';
import { detailTaskClosed, toastPushed } from '@/store/slices/uiSlice';
import {
  selectTaskById, selectUsers, selectMyPermissions, selectActor,
  selectTaskActivity, selectCurrentWorkspace,
} from '@/store/selectors';
import { useApp } from '@/context/AppProvider';

const TABS = ['details', 'subtasks', 'files', 'comments', 'activity'];

/* ------------------------------- comments --------------------------------- */

function Comments({ task }) {
  const dispatch = useDispatch();
  const { confirm } = useApp();
  const users = useSelector(selectUsers);
  const actor = useSelector(selectActor);
  const comments = useSelector((s) => s.data.present.comments.filter((c) => c.taskId === task.id));
  const wsMembers = useSelector((s) => {
    const ws = s.data.present.workspaces.find((w) => w.id === s.ui.currentWorkspaceId);
    return ws ? users.filter((u) => ws.members.some((m) => m.userId === u.id)) : users;
  });
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null); // null | {start, query}
  const [mentionIdx, setMentionIdx] = useState(0);
  const boxRef = useRef(null);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.query.toLowerCase();
    return wsMembers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 5);
  }, [mentionQuery, wsMembers]);

  const onChange = (e) => {
    const val = e.target.value;
    setDraft(val);
    const upto = val.slice(0, e.target.selectionStart ?? val.length);
    const m = upto.match(/@([\w.]*)$/);
    setMentionQuery(m ? { start: upto.length - m[0].length, query: m[1] } : null);
    setMentionIdx(0);
  };

  const pickMention = (user) => {
    if (!mentionQuery) return;
    const before = draft.slice(0, mentionQuery.start);
    const after = draft.slice(mentionQuery.start + 1 + mentionQuery.query.length);
    setDraft(`${before}@${user.name.split(' ')[0]} ${after}`);
    setMentionQuery(null);
    boxRef.current?.focus();
  };

  const onKey = (e) => {
    if (mentionMatches.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => (i + 1) % mentionMatches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => (i - 1 + mentionMatches.length) % mentionMatches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickMention(mentionMatches[mentionIdx]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const resolveMentions = (body) =>
    wsMembers
      .filter((u) => {
        const handle = `@${u.name.split(' ')[0]}`;
        return body.toLowerCase().includes(handle.toLowerCase());
      })
      .map((u) => u.id);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    dispatch(
      commentAdded({
        id: uid('c'),
        taskId: task.id,
        projectId: task.projectId,
        authorId: actor?.id,
        body,
        mentions: resolveMentions(body),
        createdAt: new Date().toISOString(),
      })
    );
    setDraft('');
    setMentionQuery(null);
  };

  const renderBody = (body) => {
    const parts = body.split(/(@[\w.]*)/g);
    return parts.map((p, i) =>
      p.startsWith('@') ? (
        <span key={i} className="mention">{p}</span>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  return (
    <div className="stack-12">
      <div className="comment-list">
        {comments.length === 0 && <span className="mono-label">No comments yet.</span>}
        {comments.map((c) => {
          const author = users.find((u) => u.id === c.authorId);
          const own = c.authorId === actor?.id;
          return (
            <div key={c.id} className={`comment ${own ? 'own' : ''}`}>
              <Avatar user={author} size={30} ring />
              <div className="comment-bubble">
                <div className="comment-meta">
                  <span className="comment-author">{author?.name ?? 'ghost'}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}{c.editedAt ? ' ✳ edited' : ''}</span>
                </div>
                {editingId === c.id ? (
                  <div className="stack-8">
                    <textarea
                      className="input"
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div className="row-gap-6">
                      <button
                        type="button"
                        className="btn btn-sm btn-accent"
                        onClick={() => {
                          if (editText.trim()) dispatch(commentUpdated({ id: c.id, patch: { body: editText.trim() } }));
                          setEditingId(null);
                        }}
                      >
                        save
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => setEditingId(null)}>nah</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="comment-body">{renderBody(c.body)}</div>
                    {own && (
                      <div className="comment-actions">
                        <button type="button" onClick={() => { setEditingId(c.id); setEditText(c.body); }}>
                          <Pencil size={10} style={{ display: 'inline', verticalAlign: -1 }} /> edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'delete this comment?',
                              body: 'it will be gone. no trace. like it never happened.',
                              confirmText: 'delete',
                            });
                            if (ok) dispatch(commentDeleted(c.id));
                          }}
                        >
                          delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {actor && (
        <div className="mention-box">
          {mentionMatches.length > 0 && (
            <div className="mention-pop">
              {mentionMatches.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  className={`mention-item ${i === mentionIdx ? 'active' : ''}`}
                  onMouseEnter={() => setMentionIdx(i)}
                  onClick={() => pickMention(u)}
                >
                  <Avatar user={u} size={22} />
                  {u.name} <span className="mono-label">{u.email}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={boxRef}
            className="input"
            rows={2}
            placeholder="Write a comment… @ to mention someone"
            value={draft}
            onChange={onChange}
            onKeyDown={onKey}
          />
          <div className="row-between" style={{ marginTop: 8 }}>
            <span className="mono-label">⌘+enter to send</span>
            <button type="button" className="btn btn-sm btn-accent" onClick={submit}>
              <Send size={12} strokeWidth={2.5} /> comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ main modal -------------------------------- */

export default function TaskDetail() {
  const dispatch = useDispatch();
  const { confirm } = useApp();
  const taskId = useSelector((s) => s.ui.detailTaskId);
  const task = useSelector((s) => selectTaskById(s, taskId));
  const users = useSelector(selectUsers);
  const actor = useSelector(selectActor);
  const perms = useSelector(selectMyPermissions);
  const project = useSelector((s) =>
    task ? s.data.present.projects.find((p) => p.id === task.projectId) : null
  );
  const ws = useSelector(selectCurrentWorkspace);
  const activity = useSelector((s) => (task ? selectTaskActivity(s, task.id) : []));

  const [tab, setTab] = useState('details');
  const [subDraft, setSubDraft] = useState('');
  const [promoteTarget, setPromoteTarget] = useState('');
  const attachmentsInput = useRef(null);

  useEffect(() => {
    setTab('details');
    setSubDraft('');
    setPromoteTarget('');
  }, [taskId]);

  const canEdit = perms.can('editTasks') && project && !project.archived;
  const memberUsers = useMemo(
    () => (ws && project ? users.filter((u) => project.memberIds.includes(u.id) || ws.members.some((m) => m.userId === u.id)) : users),
    [ws, project, users]
  );
  // candidate parents for "turn into subtask": other tasks in the same project
  const siblingTasks = useSelector((s) =>
    project ? s.data.present.tasks.filter((t) => t.projectId === project.id && t.id !== taskId) : []
  );

  if (!taskId || !task) return null;

  const patch = (p) => dispatch(taskPatched({ id: task.id, patch: p }));

  const remove = async () => {
    const ok = await confirm({
      title: `Delete "${task.title}"?`,
      body: 'The task and its comments will be deleted. You can undo from the toast.',
      confirmText: 'Delete',
    });
    if (!ok) return;
    dispatch(deleteTaskOptimistic({ id: task.id }));
    dispatch(toastPushed({
      tone: 'undo',
      text: `"${task.title}" deleted`,
      action: { label: 'undo', type: '@history/undo' },
    }));
    dispatch(detailTaskClosed());
  };

  const duplicate = () => {
    const newId = uid('t');
    dispatch(taskDuplicated({ id: task.id, newId }));
    dispatch(toastPushed({ text: 'Task duplicated' }));
    dispatch(detailTaskClosed());
    setTimeout(() => dispatch({ type: 'ui/detailTaskOpened', payload: newId }), 30);
  };

  const promoteSubtask = (st) => {
    const targetProject = project;
    if (!targetProject) return;
    const newTask = {
      id: uid('t'),
      projectId: targetProject.id,
      workspaceId: targetProject.workspaceId,
      columnId: task.columnId,
      title: st.title,
      description: `promoted from "${task.title}"`,
      priority: task.priority,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      labels: task.labels,
      subtasks: [],
      attachments: [],
      createdById: actor?.id ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: st.done ? new Date().toISOString() : null,
      order: (task.order ?? 0) - 0.5,
    };
    dispatch(subtaskPromoted({ taskId: task.id, subtaskId: st.id, newTask }));
    dispatch(toastPushed({ text: 'Subtask promoted to a task' }));
  };

  const demoteToSubtask = async (targetTaskId) => {
    if (!targetTaskId) return;
    const target = siblingTasks.find((t) => t.id === targetTaskId);
    const ok = await confirm({
      title: 'demote this task?',
      body: `"${task.title}" will become a subtask of "${target?.title}". Its comments will be removed.`,
      confirmText: 'demote it',
      danger: false,
    });
    if (!ok) return;
    dispatch(taskDemoted({ taskId: task.id, targetTaskId }));
    dispatch(toastPushed({ tone: 'undo', text: `"${task.title}" demoted to subtask`, action: { label: 'undo', type: '@history/undo' } }));
    dispatch(detailTaskClosed());
  };

  const addFiles = (fileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > 700 * 1024) {
        dispatch(toastPushed({ tone: 'warn', text: `"${file.name}" is too chunky (700kb max for demo storage)` }));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        dispatch(
          attachmentAdded({
            taskId: task.id,
            attachment: { id: uid('att'), name: file.name, type: file.type, size: file.size, data: reader.result },
          })
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const doneSubs = task.subtasks.filter((s) => s.done).length;

  return (
    <Modal
      open
      onClose={() => dispatch(detailTaskClosed())}
      width={660}
      eyebrow={
        <span>
          {project?.emoji} {project?.name} ✳ {ws?.name}
        </span>
      }
      title={undefined}
    >
      {/* title + complete */}
      <div className="detail-title-row">
        <button
          type="button"
          className={`icon-btn ${task.completedAt ? 'btn-accent' : ''}`}
          style={task.completedAt ? { background: 'var(--accent)' } : undefined}
          disabled={!canEdit}
          title={task.completedAt ? 'reopen' : 'mark shipped'}
          onClick={() => patch({ completedAt: task.completedAt ? null : new Date().toISOString() })}
        >
          <Check size={16} strokeWidth={3} />
        </button>
        <input
          className="input detail-title-input"
          defaultValue={task.title}
          disabled={!canEdit}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== task.title) patch({ title: v });
            else e.target.value = task.title;
          }}
        />
      </div>

      {!canEdit && (
        <div className="access-denied">
          🔒 read-only: {project?.archived ? 'this project is archived' : `your role (${perms.role}) cannot edit tasks`}
        </div>
      )}

      {/* tabs */}
      <div className="detail-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
            {t === 'subtasks' && task.subtasks.length > 0 && ` ${doneSubs}/${task.subtasks.length}`}
            {t === 'files' && task.attachments.length > 0 && ` ${task.attachments.length}`}
          </button>
        ))}
      </div>

      {/* ------------------------------- details ------------------------------ */}
      {tab === 'details' && (
        <div className="stack-16">
          <div className="meta-grid">
            <label className="field">
              <span className="mono-label">status</span>
              <select className="input select" value={task.columnId} disabled={!canEdit} onChange={(e) => patch({ columnId: e.target.value })}>
                {project?.columns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="mono-label">priority</span>
              <select className="input select" value={task.priority} disabled={!canEdit} onChange={(e) => patch({ priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="mono-label">assignee</span>
              <select className="input select" value={task.assigneeId ?? ''} disabled={!canEdit} onChange={(e) => patch({ assigneeId: e.target.value || null })}>
                <option value="">unassigned</option>
                {memberUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.emoji} {u.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="mono-label">due date</span>
              <input className="input" type="date" value={toDateInputValue(task.dueDate)} disabled={!canEdit} onChange={(e) => patch({ dueDate: e.target.value || null })} />
            </label>
          </div>

          <label className="field">
            <span className="mono-label">description</span>
            <textarea
              className="input detail-desc-input"
              defaultValue={task.description ?? ''}
              disabled={!canEdit}
              placeholder="Add details…"
              onBlur={(e) => {
                if (e.target.value !== (task.description ?? '')) patch({ description: e.target.value });
              }}
            />
          </label>

          <div className="field">
            <span className="mono-label">labels</span>
            <div className="filter-chips">
              {['design', 'frontend', 'backend', 'research', 'bug', 'content', 'asap', 'meetings', 'planning'].map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`filter-chip ${task.labels.includes(l) ? 'on' : ''}`}
                  disabled={!canEdit}
                  onClick={() =>
                    patch({ labels: task.labels.includes(l) ? task.labels.filter((x) => x !== l) : [...task.labels, l] })
                  }
                >
                  #{l}
                </button>
              ))}
            </div>
          </div>

          <div className="row-wrap row-gap-6" style={{ borderTop: '2px solid var(--surface-2)', paddingTop: 14 }}>
            <button type="button" className="btn btn-sm" disabled={!canEdit} onClick={duplicate}>
              <Copy size={12} strokeWidth={2.5} /> duplicate
            </button>
            {siblingTasks.length > 0 && canEdit && (
              <select
                className="input select filter-select"
                value=""
                onChange={(e) => demoteToSubtask(e.target.value)}
                title="turn this task into a subtask of…"
              >
                <option value="">demote to subtask of…</option>
                {siblingTasks.slice(0, 20).map((t) => (
                  <option key={t.id} value={t.id}>↘ {t.title}</option>
                ))}
              </select>
            )}
            <span className="spacer" />
            <button type="button" className="btn btn-sm btn-danger" disabled={!perms.can('deleteTasks')} onClick={remove}>
              <Trash2 size={12} strokeWidth={2.5} /> delete task
            </button>
          </div>
          <span className="mono-label">created {friendlyDate(task.createdAt)} ✳ updated {timeAgo(task.updatedAt)}</span>
        </div>
      )}

      {/* ------------------------------ subtasks ------------------------------ */}
      {tab === 'subtasks' && (
        <div className="stack-12">
          {task.subtasks.length > 0 && (
            <div className="subtask-progress">
              <div
                className="subtask-progress-fill"
                style={{ width: `${Math.round((doneSubs / task.subtasks.length) * 100)}%` }}
              />
            </div>
          )}
          {task.subtasks.map((st) => (
            <div key={st.id} className={`subtask-row ${st.done ? 'done' : ''}`}>
              <input
                type="checkbox"
                className="check"
                checked={st.done}
                disabled={!canEdit}
                onChange={() => dispatch(subtaskToggled({ taskId: task.id, subtaskId: st.id, done: !st.done }))}
              />
              <input
                className="subtask-title-input input"
                defaultValue={st.title}
                disabled={!canEdit}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== st.title) dispatch(subtaskRenamed({ taskId: task.id, subtaskId: st.id, title: v }));
                  else e.target.value = st.title;
                }}
              />
              {canEdit && (
                <>
                  <button type="button" className="icon-btn icon-btn-sm" title="promote to task" onClick={() => promoteSubtask(st)}>
                    <ArrowUpRight size={12} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-sm"
                    title="remove"
                    onClick={() => dispatch(subtaskDeleted({ taskId: task.id, subtaskId: st.id }))}
                  >
                    <Trash2 size={12} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </div>
          ))}
          {canEdit && (
            <div className="row-gap-6">
              <input
                className="input"
                placeholder="add a subtask…"
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && subDraft.trim()) {
                    dispatch(subtaskAdded({ taskId: task.id, subtask: { id: uid('st'), title: subDraft.trim(), done: false } }));
                    setSubDraft('');
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-accent"
                onClick={() => {
                  if (!subDraft.trim()) return;
                  dispatch(subtaskAdded({ taskId: task.id, subtask: { id: uid('st'), title: subDraft.trim(), done: false } }));
                  setSubDraft('');
                }}
              >
                <Plus size={12} strokeWidth={2.5} /> add
              </button>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------- files ------------------------------- */}
      {tab === 'files' && (
        <div className="stack-12">
          {task.attachments.length === 0 && <span className="mono-label">No files attached yet.</span>}
          {task.attachments.map((a) => (
            <div key={a.id} className="attachment-row">
              <Paperclip size={14} strokeWidth={2.5} />
              {a.type?.startsWith('image/') ? (
                <img src={a.data} alt={a.name} style={{ width: 34, height: 34, objectFit: 'cover', border: '2px solid var(--ink)' }} />
              ) : (
                <span className="tag">file</span>
              )}
              <span className="attachment-name">{a.name}</span>
              <span className="attachment-size">{(a.size / 1024).toFixed(1)}kb</span>
              {a.type?.startsWith('image/') && (
                <a className="btn btn-sm" href={a.data} download={a.name}>download</a>
              )}
              {canEdit && (
                <button type="button" className="icon-btn icon-btn-sm" onClick={() => dispatch(attachmentRemoved({ taskId: task.id, attachmentId: a.id }))}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <>
              <input
                ref={attachmentsInput}
                type="file"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <button type="button" className="btn btn-sm" onClick={() => attachmentsInput.current?.click()}>
                <Paperclip size={13} strokeWidth={2.5} /> attach files (stored locally)
              </button>
            </>
          )}
        </div>
      )}

      {/* ------------------------------ comments ------------------------------ */}
      {tab === 'comments' && <Comments task={task} />}

      {/* ------------------------------ activity ------------------------------ */}
      {tab === 'activity' && (
        <div className="activity-list">
          {activity.length === 0 && <span className="mono-label">No activity yet.</span>}
          {activity.map((a) => {
            const actorUser = users.find((u) => u.id === a.actorId);
            return (
              <div key={a.id} className="activity-item">
                <Avatar user={actorUser} size={26} />
                <span className="activity-actor">{actorUser?.name ?? 'someone'}</span>
                <span className="activity-text">{a.text}</span>
                <span className="activity-time">{timeAgo(a.ts)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
