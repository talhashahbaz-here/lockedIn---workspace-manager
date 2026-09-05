/* ScreenLoader — shown while the store rehydrates from IndexedDB. */

export default function ScreenLoader({ label = 'locking in…' }) {
  return (
    <div className="screen-loader">
      <div className="screen-loader-box">
        <div className="screen-loader-bounce" aria-hidden />
        <span className="mono-label">LockedIn</span>
      </div>
      <div className="screen-loader-marquee" aria-hidden>
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>lock in. ship. repeat. ✳ {label} ✳ </span>
          ))}
        </div>
      </div>
    </div>
  );
}
