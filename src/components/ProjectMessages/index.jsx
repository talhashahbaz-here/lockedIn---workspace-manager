/* ProjectMessages — discussion thread for a project with member tagging and notifications. */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Send, AtSign, MessageSquare } from 'lucide-react';
import { uid, timeAgo } from '@/config/global';
import { projectMessageSent } from '@/store/slices/dataSlice';
import { selectActorId, selectUsers, selectProjectMessages } from '@/store/selectors';
import Avatar from '@/components/Avatar';

export default function ProjectMessages({ project, members = [] }) {
  const dispatch = useDispatch();
  const actorId = useSelector(selectActorId);
  const users = useSelector(selectUsers);
  const messages = useSelector((s) => selectProjectMessages(s, project.id));

  const [text, setText] = useState('');
  const [mentions, setMentions] = useState([]);

  // Tag a member
  const handleTagMember = (m) => {
    const handle = `@${m.name.split(' ')[0]}`;
    if (!mentions.includes(m.id)) {
      setMentions((prev) => [...prev, m.id]);
    }
    setText((prev) => `${prev ? prev + ' ' : ''}${handle} `);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;

    // Detect any additional mentions by scanning member names
    const detectedMentions = new Set(mentions);
    members.forEach((m) => {
      const firstName = m.name.split(' ')[0].toLowerCase();
      const fullName = m.name.toLowerCase();
      if (clean.toLowerCase().includes(`@${firstName}`) || clean.toLowerCase().includes(`@${fullName}`)) {
        detectedMentions.add(m.id);
      }
    });

    dispatch(
      projectMessageSent({
        id: uid('pm'),
        projectId: project.id,
        authorId,
        text: clean,
        mentions: Array.from(detectedMentions),
        createdAt: new Date().toISOString(),
      })
    );

    setText('');
    setMentions([]);
  };

  return (
    <div className="project-messages-panel">
      <div className="project-messages-header">
        <div className="row-gap-6">
          <MessageSquare size={16} strokeWidth={2.5} />
          <h3 style={{ fontSize: 16, margin: 0 }}>Project Discussion & Updates</h3>
        </div>
        <span className="mono-label">{messages.length} message{messages.length === 1 ? '' : 's'}</span>
      </div>

      <div className="project-messages-list">
        {messages.length === 0 ? (
          <div className="empty-chat-placeholder">
            <span style={{ fontSize: 24 }}>💬</span>
            <p className="mono-label" style={{ marginTop: 6 }}>No messages yet in this project. Tag teammates with @ to notify them!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const author = users.find((u) => u.id === msg.authorId);
            const isMe = msg.authorId === actorId;
            return (
              <div key={msg.id} className={`chat-message ${isMe ? 'chat-message-me' : ''}`}>
                <div className="chat-message-avatar">
                  <Avatar user={author} size={26} />
                </div>
                <div className="chat-message-content">
                  <div className="chat-message-meta">
                    <span className="chat-message-author">{author?.name ?? 'Unknown'}</span>
                    <span className="chat-message-time">{timeAgo(msg.createdAt)}</span>
                  </div>
                  <div className="chat-message-text">
                    {msg.text.split(/(@\w+)/g).map((part, i) => {
                      if (part.startsWith('@')) {
                        return <span key={i} className="chat-mention">{part}</span>;
                      }
                      return part;
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="project-message-composer" onSubmit={handleSend}>
        <div className="mention-tagger-bar">
          <span className="mono-label" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <AtSign size={12} /> tag member:
          </span>
          <div className="tagger-chips">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`tagger-chip ${mentions.includes(m.id) ? 'active' : ''}`}
                onClick={() => handleTagMember(m)}
                title={`Tag ${m.name}`}
              >
                <span>{m.emoji}</span> @{m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="composer-row">
          <input
            className="input composer-input"
            type="text"
            placeholder={`Message #${project.name} (type @ to tag project members)...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn btn-accent" disabled={!text.trim()}>
            <Send size={13} strokeWidth={2.5} /> Send
          </button>
        </div>
      </form>
    </div>
  );
}
