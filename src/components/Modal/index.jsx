/* Modal — the brutal dialog. hard border, hard shadow, zero rounded corners. */

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, eyebrow, children, footer, width = 560 }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-panel" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div>
            {eyebrow && <div className="mono-label">{eyebrow}</div>}
            {title && <h3 className="modal-title">{title}</h3>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
