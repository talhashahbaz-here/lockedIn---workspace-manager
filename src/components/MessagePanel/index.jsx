/* MessagePanel — the project message thread. project members can tag
   other members with @ (autocomplete) and talk; tagged users get a
   notification. rendered as a right-hand drawer on the project page. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Send } from 'lucide-react';
import Avatar from '../Avatar';
import { uid, timeAgo } from '@/config/global';
import { messageAdded } from '@/store/slices/dataSlice';
import { selectCanEditProjectTasks } from '@/store/selectors';

export default function MessagePanel({ project, onClose }) {
  const dispatch = useDispatch();
  const users = useSelector((s) => s.data.present.users);
  const actor = useSelector((s) => s.data.present.users.find((u) => u.id === s.ui.actorId));
  const canPost = useSelector((s) => selectCanEditProjectTasks(s, project.id));
  const messages = useSelector((s) =>
    s.data.present.messages
      .filter((m) => m.projectId === project.id)
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  );
  const memberUsers = useMemo(
    () => users.filter((u) => project.memberIds.includes(u.id)),
    [users, project.memberIds]
  );

  const [draft, setDraft] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null); // null | {start, query}
  const [mentionIdx, setMentionIdx] = useState(0);
  const boxRef = useRef(null);

  // opening the panel marks the thread as read (drives the unread badge)
  useEffect(() => {
    try {
      localStorage.setItem(`lockedin-msg-read-${project.id}-${actor?.id}`, String(Date.now()));
    } catch { /* fine */ }
  }, [project.id, actor?.id]);

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.query.toLowerCase();
    return memberUsers
      .filter((u) => u.id !== actor?.id && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [mentionQuery, memberUsers, actor]);

  const onChange = (e) => {
    const val = e.target.value;
    setDraft(val);
    const upto = val.slice(0, e.target.selectionStart ?? val.length);
    const m = upto.match(/@([\w.]*)$/);
    setMentionQuery(m ? { start: upto.length - m[0].length, query: m[1] } : null);
    setMentionIdx(0);
  };

  const pickMention = (u) => {
    if (!mentionQuery) return;
    const before = draft.slice(0, mentionQuery.start);
    const after = draft.slice(mentionQuery.start + 1 + mentionQuery.query.length);
    setDraft(`${before}@${u.name.split(' ')[0]} ${after}`);
    setMentionQuery(null);
    boxRef.current?.focus();
  };

  const onKey = (e) => {
    if (mentionMatches.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => (i + 1) % mentionMatches.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => (i - 1 + mentionMatches.length) % mentionMatches.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pickMention(mentionMatches[mentionIdx]); return; }
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const send = () => {
    const body = draft.trim();
    if (!body || !canPost) return;
    const mentions = memberUsers
      .filter((u) => body.toLowerCase().includes(`@${u.name.split(' ')[0].toLowerCase()}`))
      .map((u) => u.id);
    dispatch(messageAdded({
      id: uid('m'),
      projectId: project.id,
      authorId: actor?.id,
      body,
      mentions,
      createdAt: new Date().toISOString(),
    }));
    setDraft('');
    setMentionQuery(null);
  };

  const renderBody = (body) =>
    body.split(/(@[\w.]*)/g).map((part, i) =>
      part.startsWith('@') ? <span key={i} className="mention">{part}</span> : <span key={i}>{part}</span>
    );

  return (
    <aside className="side-drawer">
      <header className="side-drawer-head">
        <span className="mono-label">{project.emoji} {project.name} · messages</span>
        <button type="button" className="icon-btn icon-btn-sm" onClick={onClose} aria-label="close messages">
          <X size={13} strokeWidth={2.5} />
        </button>
      </header>

      <div className="side-drawer-body">
        {messages.length === 0 && <span className="mono-label">no messages yet — say hi to the team.</span>}
        <div className="msg-list">
          {messages.map((m) => {
            const author = users.find((u) => u.id === m.authorId);
            const own = m.authorId === actor?.id;
            return (
              <div key={m.id} className={`msg-row ${own ? 'own' : ''}`}>
                <Avatar user={author} size={26} ring />
                <div className="msg-bubble">
                  <div className="msg-meta">
                    <span className="msg-author">{author?.name ?? 'ghost'}</span>
                    <span className="msg-time">{timeAgo(m.createdAt)}</span>
                  </div>
                  <div className="msg-body">{renderBody(m.body)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canPost ? (
        <footer className="side-drawer-foot msg-composer">
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
                  <Avatar user={u} size={20} />
                  {u.name}
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={boxRef}
            className="input"
            rows={2}
            placeholder="message the project team… @ to tag"
            value={draft}
            onChange={onChange}
            onKeyDown={onKey}
          />
          <div className="row-between">
            <span className="mono-label">enter to send</span>
            <button type="button" className="btn btn-sm btn-accent" onClick={send}>
              <Send size={12} strokeWidth={2.5} /> send
            </button>
          </div>
        </footer>
      ) : (
        <footer className="side-drawer-foot">
          <span className="mono-label">only project members can post here</span>
        </footer>
      )}
    </aside>
  );
}
