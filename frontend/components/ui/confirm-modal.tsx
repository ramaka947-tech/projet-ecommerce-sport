'use client';
import { AlertTriangle, Loader2 } from 'lucide-react';

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isLoading = false,
  onConfirm,
  onCancel,
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${isDanger ? 'bg-action-soft text-action' : 'bg-canvas text-ink'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="mb-2 text-center text-lg font-bold text-ink">{title}</h3>
          <p className="text-center text-sm text-ink/60">{message}</p>
        </div>
        <div className="flex gap-3 border-t border-line bg-canvas/30 p-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-11 flex-1 rounded-xl border border-line bg-white px-4 font-semibold text-ink transition hover:bg-canvas disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 font-semibold text-white transition disabled:opacity-50 ${isDanger ? 'bg-action hover:bg-action-dark' : 'bg-ink hover:bg-ink/90'}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}