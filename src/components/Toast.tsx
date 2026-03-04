import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/50 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  info: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300',
};

function ToastItem({ id, type, message }: { id: string; type: string; message: string }) {
  const removeToast = useAppStore(s => s.removeToast);
  const Icon = ICONS[type as keyof typeof ICONS] || Info;
  const colorClass = COLORS[type as keyof typeof COLORS] || COLORS.info;

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 3000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg min-w-72 max-w-sm animate-slide-in ${colorClass}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function Toast() {
  const toasts = useAppStore(s => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
