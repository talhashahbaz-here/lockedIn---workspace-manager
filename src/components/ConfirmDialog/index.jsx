/* ConfirmDialog — confirmation gate for destructive actions. */

import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';

export default function ConfirmDialog({
  open,
  onSettle,
  title = 'Are you sure?',
  body = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
}) {
  return (
    <Modal open={open} onClose={() => onSettle(false)} width={420}>
      <div className="confirm-body">
        <div className={`confirm-icon ${danger ? 'danger' : ''}`}>
          <AlertTriangle size={22} strokeWidth={2.5} />
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-sub">{body}</p>
        <div className="confirm-actions">
          <button type="button" className="btn" onClick={() => onSettle(false)}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-accent'}`}
            onClick={() => onSettle(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
