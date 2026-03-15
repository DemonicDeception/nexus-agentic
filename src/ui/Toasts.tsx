import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export interface Toast {
  id: string;
  agentName: string;
  message: string;
  color: string;
  timestamp: number;
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  // Auto-remove toasts after 4s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      removeToast(toasts[0].id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return (
    <div className="toast-container">
      {toasts.slice(-5).map((toast) => (
        <div key={toast.id} className="toast" style={{ borderLeftColor: toast.color }}>
          <span className="toast-agent" style={{ color: toast.color }}>{toast.agentName}</span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
