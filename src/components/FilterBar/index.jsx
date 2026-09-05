/* FilterBar — filters (assignee, priority, status, label, due range, text),
   sorting, group-by, and saved presets. the power-user cockpit. */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SlidersHorizontal, X, Save, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import {
  filtersPatched, filtersCleared, sortSet, presetSaved, presetDeleted, groupBySet,
} from '@/store/slices/uiSlice';
import { PRIORITIES, LABEL_POOL } from '@/config/global';
import { selectCurrentWorkspaceId, selectUI } from '@/store/selectors';

const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export default function FilterBar({ columns = [], members = [], showGroupBy = false, count, totalCount }) {
  const dispatch = useDispatch();
  const { filters, sort, groupBy, savedPresets } = useSelector(selectUI);
  const wsId = useSelector(selectCurrentWorkspaceId);
  const [naming, setNaming] = useState(false);
  const [presetName, setPresetName] = useState('');

  // union columns by title so global views can filter across projects
  const titleMap = new Map();
  columns.forEach((c) => {
    if (!titleMap.has(c.title)) titleMap.set(c.title, []);
    titleMap.get(c.title).push(c.id);
  });

  const activeCount =
    filters.assigneeIds.length + filters.priorities.length + filters.statuses.length +
    filters.labels.length + (filters.dueFrom ? 1 : 0) + (filters.dueTo ? 1 : 0);

  const toggleStatusTitle = (title) => {
    const ids = titleMap.get(title);
    const allOn = ids.every((id) => filters.statuses.includes(id));
    dispatch(filtersPatched({
      statuses: allOn
        ? filters.statuses.filter((id) => !ids.includes(id))
        : [...new Set([...filters.statuses, ...ids])],
    }));
  };

  const presets = savedPresets.filter((p) => p.workspaceId === wsId);

  const savePreset = () => {
    if (!presetName.trim()) return;
    dispatch(presetSaved({ workspaceId: wsId, name: presetName.trim(), filters, sort }));
    setPresetName('');
    setNaming(false);
  };

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <span className="mono-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <SlidersHorizontal size={13} strokeWidth={2.5} /> filters {activeCount > 0 && `(${activeCount})`}
        </span>
        <input
          className="input filter-input-sm"
          placeholder="search tasks…"
          value={filters.q}
          onChange={(e) => dispatch(filtersPatched({ q: e.target.value }))}
        />
        <span className="spacer" />

        <select
          className="input select filter-select"
          value={sort.by}
          onChange={(e) => dispatch(sortSet({ ...sort, by: e.target.value }))}
          title="sort by"
        >
          <option value="due">sort: due</option>
          <option value="priority">sort: priority</option>
          <option value="created">sort: created</option>
          <option value="title">sort: a→z</option>
        </select>
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          title={`sort ${sort.dir === 'asc' ? 'descending' : 'ascending'}`}
          onClick={() => dispatch(sortSet({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' }))}
        >
          {sort.dir === 'asc' ? <ArrowUpNarrowWide size={13} strokeWidth={2.5} /> : <ArrowDownWideNarrow size={13} strokeWidth={2.5} />}
        </button>

        {showGroupBy && (
          <select
            className="input select filter-select"
            value={groupBy}
            onChange={(e) => dispatch(groupBySet(e.target.value))}
            title="group by"
          >
            <option value="none">group: none</option>
            <option value="assignee">group: assignee</option>
            <option value="status">group: status</option>
            <option value="priority">group: priority</option>
            <option value="label">group: label</option>
          </select>
        )}

        {activeCount > 0 && (
          <button type="button" className="btn btn-sm" onClick={() => dispatch(filtersCleared())}>
            <X size={12} strokeWidth={2.5} /> clear
          </button>
        )}
        {typeof count === 'number' && (
          <span className="filter-count-note">
            {count}/{totalCount} tasks
          </span>
        )}
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {members.map((u) => (
            <button
              key={u.id}
              type="button"
              className={`filter-chip ${filters.assigneeIds.includes(u.id) ? 'on' : ''}`}
              onClick={() => dispatch(filtersPatched({ assigneeIds: toggleIn(filters.assigneeIds, u.id) }))}
            >
              {u.emoji} {u.name.split(' ')[0]}
            </button>
          ))}
          <button
            type="button"
            className={`filter-chip ${filters.assigneeIds.includes('unassigned') ? 'on' : ''}`}
            onClick={() => dispatch(filtersPatched({ assigneeIds: toggleIn(filters.assigneeIds, 'unassigned') }))}
          >
            ⚪ unassigned
          </button>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`filter-chip ${filters.priorities.includes(p.id) ? 'on' : ''}`}
              onClick={() => dispatch(filtersPatched({ priorities: toggleIn(filters.priorities, p.id) }))}
            >
              {p.label}
            </button>
          ))}
          <span className="filter-chip-sep" aria-hidden>·</span>
          {[...titleMap.keys()].map((title) => {
            const ids = titleMap.get(title);
            const on = ids.every((id) => filters.statuses.includes(id));
            return (
              <button
                key={title}
                type="button"
                className={`filter-chip ${on ? 'on' : ''}`}
                onClick={() => toggleStatusTitle(title)}
              >
                ▦ {title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {LABEL_POOL.map((l) => (
            <button
              key={l}
              type="button"
              className={`filter-chip ${filters.labels.includes(l) ? 'on' : ''}`}
              onClick={() => dispatch(filtersPatched({ labels: toggleIn(filters.labels, l) }))}
            >
              #{l}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="mono-label">due between</span>
        <input
          className="input filter-input-sm"
          type="date"
          value={filters.dueFrom ?? ''}
          onChange={(e) => dispatch(filtersPatched({ dueFrom: e.target.value || null }))}
        />
        <span className="mono-label">and</span>
        <input
          className="input filter-input-sm"
          type="date"
          value={filters.dueTo ?? ''}
          onChange={(e) => dispatch(filtersPatched({ dueTo: e.target.value || null }))}
        />
        <span className="spacer" />
        {presets.length > 0 && (
          <div className="filter-chips">
            {presets.map((p) => (
              <span key={p.id} className="preset-chip">
                <button
                  type="button"
                  onClick={() => {
                    dispatch(filtersPatched(p.filters));
                    dispatch(sortSet(p.sort));
                  }}
                >
                  ⚡ {p.name}
                </button>
                <button type="button" title="delete preset" onClick={() => dispatch(presetDeleted(p.id))}>
                  <X size={11} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}
        {naming ? (
          <span className="row-gap-6">
            <input
              className="input filter-input-sm"
              autoFocus
              placeholder="preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && savePreset()}
            />
            <button type="button" className="btn btn-sm btn-accent" onClick={savePreset}>save</button>
            <button type="button" className="btn btn-sm" onClick={() => setNaming(false)}>nah</button>
          </span>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => setNaming(true)}>
            <Save size={12} strokeWidth={2.5} /> save preset
          </button>
        )}
      </div>
    </div>
  );
}
