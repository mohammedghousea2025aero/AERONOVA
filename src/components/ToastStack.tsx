import { BellRing, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  tone: 'success' | 'alert' | 'neutral';
  title: string;
  description: string;
}

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-md pointer-events-none"
    >
      {toasts.map((toast) => {
        const toneStyles =
          toast.tone === 'alert'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : toast.tone === 'success'
              ? 'bg-white border-zinc-300 text-zinc-950'
              : 'bg-white border-zinc-300 text-zinc-900';

        const Icon =
          toast.tone === 'alert'
            ? BellRing
            : toast.tone === 'success'
              ? CheckCircle2
              : Info;

        const iconColor =
          toast.tone === 'alert'
            ? 'text-emerald-700'
            : toast.tone === 'success'
              ? 'text-[#CA8A04]'
              : 'text-zinc-500';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-xl border shadow-lg p-4 flex items-start gap-3 transition-all ${toneStyles}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{toast.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={`Dismiss notification: ${toast.title}`}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
