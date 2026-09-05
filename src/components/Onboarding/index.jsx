/* Onboarding — a calm two-step wizard for brand-new users: name your
   workspace, spawn your first project. shows only when you are in zero
   workspaces, skippable, never nagged again (per user). */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { uid, COLOR_POOL, PROJECT_TEMPLATES, DEFAULT_COLUMNS } from '@/config/global';
import { workspaceAdded, projectAdded } from '@/store/slices/dataSlice';
import { workspaceSwitched, toastPushed } from '@/store/slices/uiSlice';

const WS_EMOJIS = ['🧢', '🚀', '🎨', '🌍', '🧪', '🎮', '🛸', '🏢'];

export default function Onboarding({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const workspaces = useSelector((s) => s.data.present.workspaces);

  const memberAnywhere = workspaces.some((ws) => ws.members.some((m) => m.userId === user.id));
  const [skipped, setSkipped] = useState(() => {
    try {
      return Boolean(JSON.parse(localStorage.getItem(`lockedin-onboarded-${user.id}`)));
    } catch {
      return false;
    }
  });

  const [step, setStep] = useState(1);
  const [wsForm, setWsForm] = useState({ name: '', emoji: '🚀', color: 'lime' });
  const [pjForm, setPjForm] = useState({ name: '', emoji: '📦', color: 'lime', templateId: 'blank' });

  const finish = (e) => {
    e?.preventDefault();
    if (!wsForm.name.trim()) return;

    const wsId = uid('ws');
    const now = new Date().toISOString();
    dispatch(workspaceAdded({
      id: wsId,
      name: wsForm.name.trim().toLowerCase(),
      emoji: wsForm.emoji,
      color: wsForm.color,
      defaultView: 'board',
      createdAt: now,
      members: [{ userId: user.id, role: 'owner', joinedAt: now }],
    }));
    dispatch(workspaceSwitched(wsId));

    const template = PROJECT_TEMPLATES.find((t) => t.id === pjForm.templateId);
    if (pjForm.name.trim()) {
      const projectId = uid('p');
      dispatch(projectAdded({
        id: projectId,
        workspaceId: wsId,
        name: pjForm.name.trim().toLowerCase(),
        emoji: pjForm.emoji,
        color: pjForm.color,
        description: template.description,
        archived: false,
        columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
        memberIds: [user.id],
        createdAt: now,
        _seedTasks: template.tasks.map((t, i) => ({
          id: uid('t'),
          projectId,
          workspaceId: wsId,
          columnId: 'col_icebox',
          title: t.title,
          description: `from the "${template.name}" template`,
          priority: t.priority ?? 'medium',
          dueDate: null,
          assigneeId: user.id,
          labels: t.labels ?? [],
          subtasks: [],
          attachments: [],
          createdById: user.id,
          createdAt: now,
          updatedAt: now,
          completedAt: null,
          order: i,
        })),
      }));
    }

    try {
      localStorage.setItem(`lockedin-onboarded-${user.id}`, 'true');
    } catch { /* fine */ }

    dispatch(toastPushed({ text: 'Workspace ready. Welcome aboard!' }));
    navigate('/app/home');
  };

  const skip = () => {
    setSkipped(true);
    try {
      localStorage.setItem(`lockedin-onboarded-${user.id}`, 'true');
    } catch { /* fine */ }
  };

  if (memberAnywhere || skipped) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-head">
          <span className="brand-bolt"><Zap size={18} strokeWidth={2.5} color="#141414" /></span>
          <span className="mono-label">lockedin ✳ welcome, {user.name.split(' ')[0]}</span>
        </div>

        <div className="onboarding-steps mono-label">
          <span className={step === 1 ? 'on' : ''}>1 · your space</span>
          <span className={step === 2 ? 'on' : ''}>2 · first project</span>
        </div>

        {step === 1 ? (
          <form className="stack-16" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <h2 className="display-md">Name your workspace.</h2>
            <p className="muted text-sm">A workspace holds your projects and your team. You are the owner and can rename it anytime.</p>
            <label className="field">
              <span className="mono-label">workspace name</span>
              <input
                className="input"
                autoFocus
                placeholder="e.g. Acme Inc"
                value={wsForm.name}
                onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })}
                required
              />
            </label>
            <div className="field">
              <span className="mono-label">Emoji</span>
              <div className="avatar-picker">
                {WS_EMOJIS.map((e) => (
                  <button key={e} type="button" className={`avatar-option ${wsForm.emoji === e ? 'selected' : ''}`} onClick={() => setWsForm({ ...wsForm, emoji: e })}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="mono-label">color</span>
              <div className="avatar-picker">
                {COLOR_POOL.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    className={`color-option ${wsForm.color === c.id ? 'selected' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setWsForm({ ...wsForm, color: c.id })}
                  />
                ))}
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-ghost" onClick={skip}>Skip for now</button>
              <button type="submit" className="btn btn-accent" disabled={!wsForm.name.trim()}>Next: first project →</button>
            </div>
          </form>
        ) : (
          <form className="stack-16" onSubmit={finish}>
            <h2 className="display-md">Now, one project.</h2>
            <p className="muted text-sm">Pick a template and we will pre-fill starter tasks. The name is optional.</p>
            <div className="row-gap-6">
              <label className="field" style={{ width: 92 }}>
                <span className="mono-label">emoji</span>
                <input className="input" maxLength={2} value={pjForm.emoji} onChange={(e) => setPjForm({ ...pjForm, emoji: e.target.value })} />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="mono-label">project name (optional)</span>
                <input
                  className="input"
                  autoFocus
                  placeholder="week one"
                  value={pjForm.name}
                  onChange={(e) => setPjForm({ ...pjForm, name: e.target.value })}
                />
              </label>
            </div>
            <div className="field">
              <span className="mono-label">template</span>
              <div className="stack-8">
                {PROJECT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="mini-task"
                    style={pjForm.templateId === t.id ? { boxShadow: '3px 3px 0 var(--shadow-ink)', background: 'var(--accent)' } : undefined}
                    onClick={() => setPjForm({ ...pjForm, templateId: t.id })}
                  >
                    <span style={{ fontSize: 16 }}>{t.emoji}</span>
                    <span className="stack-4" style={{ textAlign: 'left', flex: 1 }}>
                      <b>{t.name}</b>
                      <span className="mono-label">{t.description}</span>
                    </span>
                    <span className="board-col-count">{t.tasks.length}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn" onClick={() => setStep(1)}>← back</button>
              <button type="submit" className="btn btn-accent">Finish</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
