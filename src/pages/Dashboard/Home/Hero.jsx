/* Hero — the dashboard greeting banner. */

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
  const greeting = hour < 5 ? 'still up?' : hour < 12 ? 'gm, future legend' : hour < 18 ? 'locked in hours' : 'evening grind';

  return (
    <div className="home-panel" style={{ background: 'var(--ink)', color: 'var(--bg)', flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <span
        style={{ width: 54, height: 54, background: 'var(--accent)', border: '2px solid var(--bg)', display: 'grid', placeItems: 'center', fontSize: 26 }}
        aria-hidden
      >
        <Zap size={26} strokeWidth={2.5} color="#141414" />
      </span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <span className="mono-label" style={{ color: 'var(--bg)', opacity: 0.7 }}>{greeting} ✳ {ws?.emoji} {ws?.name}</span>
        <h1 style={{ fontSize: 'clamp(24px, 3vw, 34px)' }}>
          {user ? `${user.name.split(' ')[0]}, ` : ''}stay <span className="accent-marker">locked in.</span>
        </h1>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span className="mono-label" style={{ color: 'var(--bg)', opacity: 0.7 }}>your role</span>
        <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>
          {role} — {ROLE_VIBES[role] ?? 'unknown'}
        </div>
        {role === 'viewer' && (
          <Link to="/app/members" className="mono-label" style={{ color: 'var(--accent)' }}>
            viewers cannot edit. harsh but fair →
          </Link>
        )}
      </div>
    </div>
  );
}
