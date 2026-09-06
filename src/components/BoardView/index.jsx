/* BoardView — the kanban. HTML5 drag & drop between and within columns,
   reorderable columns, inline composers, per-column menus. */

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, GripVertical, Pencil, Trash2, Check } from 'lucide-react';
import TaskCard from '../TaskCard';
import Skeleton from '../Skeleton';
import EmptyState from '../EmptyState';
import { useApp } from '@/context/AppProvider';
import { uid } from '@/config/global';
import {
  taskAdded, taskPatched, moveTaskOptimistic,
  columnAdded, columnRenamed, columnDeleted, columnMoved,
} from '@/store/slices/dataSlice';
import { toastPushed, loadingSet } from '@/store/slices/uiSlice';
import { selectVisibleProjectTasks, selectMyPermissions, selectActorId } from '@/store/selectors';

export default function BoardView({ project }) {
  const dispatch = useDispatch();
  const { confirm } = useApp();
  const actorId = useSelector(selectActorId);
  const tasks = useSelector((s) => selectVisibleProjectTasks(s, project.id));
  const perms = useSelector(selectMyPermissions);
  const loading = useSelector((s) => s.ui.loading[`board-${project.id}`]);
  const actor = useSelector((s) => s.data.present.users.find((u) => u.id === actorId));
  const isViewer = actor?.role === 'viewer' || perms.role === 'viewer';
  const isOwnerOrAdmin = perms.role === 'owner' || perms.role === 'admin' || actor?.role === 'owner' || actor?.role === 'admin';
  const canCreateInProject = !isViewer && (isOwnerOrAdmin || (project?.memberIds || []).includes(actorId));

  const [drag, setDrag] = useState(null); // {taskId, fromColumn}
  const [overCol, setOverCol] = useState(null);
  const [composer, setComposer] = useState(null); // columnId
  const [composerText, setComposerText] = useState('');
  const [renaming, setRenaming] = useState(null); // columnId
  const [renameText, setRenameText] = useState('');
  const [colDrag, setColDrag] = useState(null); // column index

  // simulated async load for skeletons
  useEffect(() => {
    dispatch(loadingSet({ scope: `board-${project.id}`, value: true }));
    const t = setTimeout(() => dispatch(loadingSet({ scope: `board-${project.id}`, value: false })), 450);
    return () => clearTimeout(t);
  }, [project.id, dispatch]);

  const byColumn = useMemo(() => {
    const map = new Map(project.columns.map((c) => [c.id, []]));
    tasks.forEach((t) => map.get(t.columnId)?.push(t));
    return map;
  }, [tasks, project.columns]);

  const dropOnColumn = (columnId) => {
    setOverCol(null);
    if (!drag) return;
    const destCol = project.columns.find((c) => c.id === columnId);
    const isDoneCol = destCol && /done|shipped/i.test(destCol.title);
    const draggedTask = tasks.find((t) => t.id === drag.taskId);

    if (isDoneCol && draggedTask && !draggedTask.completedAt && draggedTask.assigneeId !== actorId) {
      dispatch(
        toastPushed({
          tone: 'warn',
          text: 'You cannot mark a task complete (move to done) unless it is assigned to you.',
        })
      );
      setDrag(null);
      return;
    }

    const columnTasks = (byColumn.get(columnId) ?? []).filter((t) => t.id !== drag.taskId);
    const order = columnTasks.length ? (columnTasks[columnTasks.length - 1].order ?? 0) + 1 : 0;
    dispatch(moveTaskOptimistic({ id: drag.taskId, columnId, order }));
    if (isDoneCol && draggedTask && !draggedTask.completedAt) {
      dispatch(taskPatched({ id: drag.taskId, patch: { completedAt: new Date().toISOString() } }));
    }
    setDrag(null);
  };

  const dropOnCard = (columnId, index) => {
    setOverCol(null);
    if (!drag) return;
    const destCol = project.columns.find((c) => c.id === columnId);
    const isDoneCol = destCol && /done|shipped/i.test(destCol.title);
    const draggedTask = tasks.find((t) => t.id === drag.taskId);

    if (isDoneCol && draggedTask && !draggedTask.completedAt && draggedTask.assigneeId !== actorId) {
      dispatch(
        toastPushed({
          tone: 'warn',
          text: 'You cannot mark a task complete (move to done) unless it is assigned to you.',
        })
      );
      setDrag(null);
      return;
    }

    const columnTasks = (byColumn.get(columnId) ?? []).filter((t) => t.id !== drag.taskId);
    const before = columnTasks[index - 1];
    const after = columnTasks[index];
    let order;
    if (before && after) order = ((before.order ?? 0) + (after.order ?? 0)) / 2;
    else if (before) order = (before.order ?? 0) + 1;
    else if (after) order = (after.order ?? 0) - 1;
    else order = 0;
    dispatch(moveTaskOptimistic({ id: drag.taskId, columnId, order }));
    if (isDoneCol && draggedTask && !draggedTask.completedAt) {
      dispatch(taskPatched({ id: drag.taskId, patch: { completedAt: new Date().toISOString() } }));
    }
    setDrag(null);
  };

  const spawnInline = (columnId) => {
    const title = composerText.trim();
    if (!title) return;
    if (!canCreateInProject) {
      dispatch(toastPushed({ tone: 'warn', text: 'You can only create tasks in projects you are a member of.' }));
      return;
    }
    const columnTasks = byColumn.get(columnId) ?? [];
    dispatch(
      taskAdded({
        id: uid('t'),
        projectId: project.id,
        workspaceId: project.workspaceId,
        columnId,
        title,
        description: '',
        priority: 'medium',
        dueDate: null,
        assigneeId: null,
        labels: [],
        subtasks: [],
        attachments: [],
        createdById: actorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        order: columnTasks.length ? (columnTasks[columnTasks.length - 1].order ?? 0) + 1 : 0,
      })
    );
    setComposerText('');
  };

  const removeColumn = async (col) => {
    const count = (byColumn.get(col.id) ?? []).length;
    const ok = await confirm({
      title: `delete "${col.title}"?`,
      body: count
        ? `${count} task(s) in it will move to the first remaining column.`
        : 'This column is empty.',
      confirmText: 'delete column',
    });
    if (ok) dispatch(columnDeleted({ projectId: project.id, columnId: col.id }));
  };

  const renameColumn = (col) => {
    const title = renameText.trim();
    if (title && title !== col.title) dispatch(columnRenamed({ projectId: project.id, columnId: col.id, title }));
    setRenaming(null);
  };

  if (loading) return <Skeleton kind="board" />;

  return (
    <div className="board">
      {project.columns.map((col, colIndex) => {
        const colTasks = byColumn.get(col.id) ?? [];
        return (
          <section
            key={col.id}
            className={`board-col ${overCol === col.id ? 'drag-over-col' : ''}`}
            onDragOver={(e) => {
              if (drag) {
                e.preventDefault();
                setOverCol(col.id);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setOverCol((c) => (c === col.id ? null : c));
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (colDrag !== null && colDrag !== colIndex) {
                dispatch(columnMoved({ projectId: project.id, from: colDrag, to: colIndex }));
              } else {
                dropOnColumn(col.id);
              }
              setColDrag(null);
            }}
          >
            <header className="board-col-head">
              <GripVertical
                size={14}
                strokeWidth={2.5}
                style={{ cursor: perms.can('manageProjects') ? 'grab' : 'default', opacity: 0.6 }}
                draggable={perms.can('manageProjects')}
                onDragStart={() => setColDrag(colIndex)}
                onDragEnd={() => setColDrag(null)}
              />
              {renaming === col.id ? (
                <input
                  className="input"
                  style={{ padding: '4px 8px', fontSize: 12, flex: 1 }}
                  autoFocus
                  value={renameText}
                  onChange={(e) => setRenameText(e.target.value)}
                  onBlur={() => renameColumn(col)}
                  onKeyDown={(e) => e.key === 'Enter' && renameColumn(col)}
                />
              ) : (
                <span className="board-col-title" onDoubleClick={() => perms.can('manageProjects') && (setRenaming(col.id), setRenameText(col.title))}>
                  {col.title}
                </span>
              )}
              <span className="board-col-count">{colTasks.length}</span>
              {perms.can('manageProjects') && (
                <span className="row-gap-6 col-actions">
                  <button type="button" className="icon-btn icon-btn-sm" title="rename column" onClick={() => { setRenaming(col.id); setRenameText(col.title); }}>
                    <Pencil size={11} strokeWidth={2.5} />
                  </button>
                  {project.columns.length > 1 && (
                    <button type="button" className="icon-btn icon-btn-sm" title="delete column" onClick={() => removeColumn(col)}>
                      <Trash2 size={11} strokeWidth={2.5} />
                    </button>
                  )}
                </span>
              )}
            </header>

            <div className="board-col-body">
              {colTasks.length === 0 && composer !== col.id && (
                <div className="mono-label" style={{ textAlign: 'center', padding: '14px 0', border: '2px dashed var(--muted)' }}>
                  {drag ? 'Drop tasks here' : 'No tasks'}
                </div>
              )}
              {colTasks.map((t, i) => (
                <div
                  key={t.id}
                  onDragOver={(e) => {
                    if (drag) {
                      e.preventDefault();
                      e.stopPropagation();
                      setOverCol(col.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropOnCard(col.id, i);
                  }}
                >
                  <TaskCard
                    task={t}
                    draggable={perms.can('editTasks')}
                    dragging={drag?.taskId === t.id}
                    onDragStart={() => setDrag({ taskId: t.id, fromColumn: col.id })}
                    onDragEnd={() => {
                      setDrag(null);
                      setOverCol(null);
                    }}
                  />
                </div>
              ))}

              {composer === col.id ? (
                <div className="composer-inline">
                  <textarea
                    className="input"
                    autoFocus
                    rows={2}
                    placeholder="what needs doing?"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        spawnInline(col.id);
                      }
                      if (e.key === 'Escape') setComposer(null);
                    }}
                  />
                  <div className="row-gap-6">
                    <button type="button" className="btn btn-sm btn-accent" onClick={() => spawnInline(col.id)}>
                      <Plus size={12} strokeWidth={2.5} /> add
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => setComposer(null)}>
                      done
                    </button>
                  </div>
                </div>
              ) : canCreateInProject ? (
                <button type="button" className="btn btn-sm btn-block board-add-btn" onClick={() => { setComposer(col.id); setComposerText(''); }}>
                  <Plus size={12} strokeWidth={2.5} /> add task
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      {perms.can('manageProjects') && (
        <section className="board-col" style={{ background: 'transparent', borderStyle: 'dashed', boxShadow: 'none' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() =>
              dispatch(columnAdded({
                projectId: project.id,
                column: { id: uid('col'), title: `new column ${project.columns.length + 1}` },
              }))
            }
          >
            <Plus size={12} strokeWidth={2.5} /> add column
          </button>
        </section>
      )}
    </div>
  );
}
