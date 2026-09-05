/* EmptyState — for the "it is giving... nothing" moments. */

export default function EmptyState({ emoji = '🕳️', title, sub, children, compact = false }) {
  return (
    <div className={`empty-state ${compact ? 'empty-compact' : ''}`}>
      <div className="empty-emoji" aria-hidden>
        {emoji}
      </div>
      <h4 className="empty-title">{title}</h4>
      {sub && <p className="empty-sub">{sub}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}
