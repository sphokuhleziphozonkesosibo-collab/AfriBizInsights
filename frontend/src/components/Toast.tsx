import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-slate-900 text-white shadow-lg shadow-emerald-950/20',
    error: 'border-rose-500/20 bg-slate-900 text-white shadow-lg shadow-rose-950/20',
    info: 'border-indigo-500/20 bg-slate-900 text-white shadow-lg shadow-indigo-950/20',
  };

  return (
    <div
      className={`pointer-events-auto p-4 rounded-2xl border flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 duration-200 ${borders[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>
        {toast.message && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};