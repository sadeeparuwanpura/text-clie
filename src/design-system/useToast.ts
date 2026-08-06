import { createContext, useContext } from 'react';

type ToastVariant = 'info' | 'success' | 'danger';

export interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
