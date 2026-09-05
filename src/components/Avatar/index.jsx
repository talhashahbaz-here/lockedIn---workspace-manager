/* Avatar — emoji on a color block. brutal, recognizable, no uploads needed. */

import { colorOf } from '@/config/global';

export default function Avatar({ user, size = 28, ring = false, title }) {
  const hex = colorOf(user?.color).hex;
  return (
    <span
      className={`avatar ${ring ? 'avatar-ring' : ''}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.5) }}
      title={title ?? user?.name}
    >
      <span className="avatar-block" style={{ background: hex }}>
        {user?.emoji ?? '👤'}
      </span>
    </span>
  );
}
