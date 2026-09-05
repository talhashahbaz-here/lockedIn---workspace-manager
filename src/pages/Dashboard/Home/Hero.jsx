/* Hero — slim greeting banner. one line, one accent, zero noise. */

import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { selectCurrentWorkspace, selectMyRole } from '@/store/selectors';
import { ROLE_VIBES } from '@/config/global';

export default function Hero() {
  const actor = useSelector((s) => s.ui.actorId);
  const users = useSelector((s) => s.data.present.users);
  const user = users.find((u) => u.id === actor);
  const ws = useSelector(selectCurrentWorkspace);
  const role = useSelector(selectMyRole);
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'working late?' : hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : 'good evening';

  return (
    <div className="hero-slim">
      <span className="hero-bolt" aria-hidden>
        <Zap size={18} strokeWidth={2.5} color="#141414" />
      </span>
      <div className="hero-copy-slim">
        <h1>
          {greeting}, {user ? user.name.split(' ')[0] : 'friend'} — stay <span className="accent-marker">locked in.</span>
        </h1>
        <span className="mono-label">{ws?.emoji} {ws?.name}</span>
      </div>
      <span className="tag tag-ink hero-role" title={`your role in this workspace`}>
        {role} · {ROLE_VIBES[role] ?? 'unknown'}
      </span>
      {role === 'viewer' && (
        <Link to="/app/members" className="mono-label hero-viewer-note">
          read-only mode → members
        </Link>
      )}
    </div>
  );
}
