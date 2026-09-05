/* Users — members & roles. invite (fake), change roles, remove members,
   and the permission matrix so everyone knows who can do what. */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserPlus, Trash2, ShieldCheck, Crown, Shield, Eye } from 'lucide-react';
import Avatar from '@/components/Avatar';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import { ROLES, ROLE_VIBES, can as roleCan } from '@/config/global';
import { memberRoleChanged, memberRemoved, memberInvited } from '@/store/slices/dataSlice';
import { toastPushed } from '@/store/slices/uiSlice';
import {
  selectCurrentWorkspace, selectUsers, selectMyPermissions, selectActorId, selectActiveWorkspaceProjects,
} from '@/store/selectors';
import { useApp } from '@/context/AppProvider';

const ROLE_ICON = { owner: Crown, admin: ShieldCheck, member: Shield, viewer: Eye };

const MATRIX_ACTIONS = [
  ['edit + complete tasks', 'editTasks'],
  ['delete tasks', 'deleteTasks'],
  ['comment', 'comment'],
  ['create projects', 'createProjects'],
  ['manage projects & columns', 'manageProjects'],
  ['invite members', 'inviteMembers'],
  ['assign roles', 'assignRoles'],
  ['manage workspace settings', 'manageWorkspace'],
  ['delete workspace', 'deleteWorkspace'],
  ['export data', 'exportData'],
];

export default function Users() {
  const dispatch = useDispatch();
  const { confirm } = useApp();
  const ws = useSelector(selectCurrentWorkspace);
  const users = useSelector(selectUsers);
  const projects = useSelector(selectActiveWorkspaceProjects);
  const perms = useSelector(selectMyPermissions);
  const actorId = useSelector(selectActorId);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ userId: '', role: 'member' });

  if (!ws) return null;

  const members = ws.members
    .map((m) => ({ ...m, user: users.find((u) => u.id === m.userId) }))
    .filter((m) => m.user);

  const candidates = users.filter((u) => !ws.members.some((m) => m.userId === u.id));

  const setRole = (member, role) => {
    if (!roleCan(perms.role, 'assignRoles')) {
      dispatch(toastPushed({ tone: 'warn', text: 'Only the owner can change roles.' }));
      return;
    }
    if (member.userId === actorId) {
      dispatch(toastPushed({ tone: 'warn', text: 'You cannot change your own role.' }));
      return;
    }
    dispatch(memberRoleChanged({ workspaceId: ws.id, userId: member.userId, role }));
    dispatch(toastPushed({ text: `${member.user.name} is now ${role}` }));
  };

  const removeMember = async (member) => {
    if (!roleCan(perms.role, 'removeMembers')) {
      dispatch(toastPushed({ tone: 'warn', text: 'Only the owner can remove members.' }));
      return;
    }
    const ok = await confirm({
      title: `remove ${member.user.name}?`,
      body: 'They will lose access immediately. Their assigned tasks remain.',
      confirmText: 'remove them',
    });
    if (ok) {
      dispatch(memberRemoved({ workspaceId: ws.id, userId: member.userId }));
      dispatch(toastPushed({ tone: 'undo', text: `${member.user.name} removed`, action: { label: 'undo', type: '@history/undo' } }));
    }
  };

  const invite = (e) => {
    e.preventDefault();
    if (!inviteForm.userId) return;
    dispatch(memberInvited({ workspaceId: ws.id, userId: inviteForm.userId, role: inviteForm.role }));
    const u = users.find((x) => x.id === inviteForm.userId);
    dispatch(toastPushed({ text: `${u?.name} pulled into "${ws.name}" as ${inviteForm.role}` }));
    setInviteForm({ userId: '', role: 'member' });
    setInviting(false);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>members</h1>
          <p className="page-sub">
            {ws.emoji} {ws.name} — {members.length} members · {projects.length} active projects.
            Roles decide who can edit and manage.
          </p>
        </div>
        <div className="page-actions">
          {perms.can('inviteMembers') && (
            <button type="button" className="btn btn-accent" onClick={() => setInviting(true)}>
              <UserPlus size={14} strokeWidth={2.5} /> invite member
            </button>
          )}
        </div>
      </div>

      <div className="member-grid">
        {members.map((m) => {
          const Icon = ROLE_ICON[m.role];
          return (
            <article key={m.userId} className="member-card">
              <div className="member-card-head">
                <Avatar user={m.user} size={44} ring />
                <div>
                  <div className="member-name">
                    {m.user.name}
                    {m.userId === actorId && <span className="tag tag-accent" style={{ marginLeft: 6 }}>you</span>}
                  </div>
                  <div className="member-bio">{m.user.bio}</div>
                </div>
              </div>
              <div className="role-select-row">
                <Icon size={14} strokeWidth={2.5} />
                <select
                  className="input select"
                  style={{ padding: '5px 26px 5px 9px', fontSize: 12.5 }}
                  value={m.role}
                  disabled={!perms.can('assignRoles') || m.userId === actorId}
                  onChange={(e) => setRole(m, e.target.value)}
                  title={perms.can('assignRoles') ? 'change role' : 'only the owner can assign roles'}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {perms.can('removeMembers') && m.userId !== actorId && (
                  <button type="button" className="icon-btn icon-btn-sm" title="remove member" onClick={() => removeMember(m)}>
                    <Trash2 size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <span className="mono-label">{ROLE_VIBES[m.role]}</span>
            </article>
          );
        })}
      </div>

      {members.length === 0 && (
        <EmptyState emoji="👥" title="No members" sub="Invite some mock users to get started." />
      )}

      {/* permission matrix */}
      <section className="home-panel">
        <div className="home-panel-head">
          <h3>🔐 who can do what</h3>
          <span className="mono-label">Simulated client-side.</span>
        </div>
        <div className="task-table-wrap">
          <table className="task-table" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>action</th>
                {ROLES.map((r) => (
                  <th key={r} style={{ textAlign: 'center' }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ACTIONS.map(([label, action]) => (
                <tr key={action}>
                  <td className="td-title">{label}</td>
                  {ROLES.map((r) => (
                    <td key={r} style={{ textAlign: 'center' }}>
                      {roleCan(r, action) ? '✅' : '🚫'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span className="task-view-note">
          ✳ switch to a different mock profile (log out → hop into another user) to feel the
          permission-gated UI from another role's perspective.
        </span>
      </section>

      {inviting && (
        <Modal open onClose={() => setInviting(false)} eyebrow="invite (simulated)" title="Add a member" width={460}>
          <form className="stack-16" onSubmit={invite}>
            <label className="field">
              <span className="mono-label">who</span>
              <select
                className="input select"
                value={inviteForm.userId}
                onChange={(e) => setInviteForm({ ...inviteForm, userId: e.target.value })}
                autoFocus
              >
                <option value="">Pick a user…</option>
                {candidates.map((u) => (
                  <option key={u.id} value={u.id}>{u.emoji} {u.name} — {u.email}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="mono-label">role</span>
              <select
                className="input select"
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                {ROLES.filter((r) => r !== 'owner').map((r) => (
                  <option key={r} value={r}>{r} — {ROLE_VIBES[r]}</option>
                ))}
              </select>
            </label>
            {candidates.length === 0 && (
              <div className="access-denied">Everyone is already in this workspace.</div>
            )}
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setInviting(false)}>nah</button>
              <button type="submit" className="btn btn-accent" disabled={!inviteForm.userId}>add to workspace</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
