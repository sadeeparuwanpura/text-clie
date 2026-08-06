import { useCallback, useMemo, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';
import { ToastContext } from './useToast';

type ToastVariant = 'info' | 'success' | 'danger';

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
}

const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={styles.toast}
            data-variant={toast.variant}
            role={toast.variant === 'danger' ? 'alert' : 'status'}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              className={styles.dismiss}
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
