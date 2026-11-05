import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Global Toast Notification Provider
 * Replaces ad-hoc useState toast boilerplate across all views.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [exitingToastIds, setExitingToastIds] = useState(() => new Set());

  const removeToast = useCallback((id) => {
    setExitingToastIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setExitingToastIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 160);
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    dismiss: removeToast,
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-white" />;
      default:
        return <Info className="w-4 h-4 text-white" />;
    }
  };

  const getToastClass = (type) => {
    switch (type) {
      case 'success':
        return 'bg-[#15803d] text-white';
      case 'error':
        return 'bg-[#b91c1c] text-white';
      case 'warning':
        return 'bg-[#b45309] text-white';
      default:
        return 'bg-[#0038A8] text-white';
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.length > 0 && (
        <div className="toast toast-top toast-end z-[9999] mt-16 w-full max-w-md p-4 space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              data-exiting={exitingToastIds.has(t.id)}
              className={`toast-item alert ${getToastClass(t.type)} shadow-xl border-none rounded-xl flex items-center justify-between gap-3 py-3 px-4 w-full min-w-0 pointer-events-auto`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {getToastIcon(t.type)}
                <span role={t.type === 'error' ? 'alert' : 'status'} className="min-w-0 break-words text-sm font-medium">{t.message}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => removeToast(t.id)}
                className="btn btn-ghost btn-sm btn-circle shrink-0 text-white hover:text-white hover:bg-white/15"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
