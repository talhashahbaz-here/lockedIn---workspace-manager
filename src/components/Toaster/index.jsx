/* Toaster — toasts with inline undo. rendered from redux so middleware
   (npc events, rollbacks) can push them too. */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Undo2, Wifi, Radio } from 'lucide-react';
import { toastDismissed } from '@/store/slices/uiSlice';
import { UNDO } from '@/store/undo';

const ICONS = { live: Radio, warn: Wifi, undo: Undo2 };

export default function Toaster() {
  const dispatch = useDispatch();
  const toasts = useSelector((s) => s.ui.toasts);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timers = toasts.map((t) =>
      setTimeout(() => dispatch(toastDismissed(t.id)), t.action ? 6500 : 4200)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dispatch]);

  if (!toasts.length) return null;

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div key={t.id} className={`toast tone-${t.tone ?? 'default'}`}>
            {Icon && (
              <span className="toast-icon">
                <Icon size={15} strokeWidth={2.5} />
              </span>
            )}
            <span className="toast-text">{t.text}</span>
            {t.action?.label && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  dispatch({ type: t.action.type });
                  dispatch(toastDismissed(t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" className="toast-x" onClick={() => dispatch(toastDismissed(t.id))} aria-label="dismiss">
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
