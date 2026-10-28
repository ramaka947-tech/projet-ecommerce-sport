'use client';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useEffect } from 'react';

type ToastProps = {
  isOpen: boolean;
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
};

export default function Toast({ isOpen, type, message, onClose }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] flex justify-center sm:left-auto sm:right-6 sm:max-w-md">
      <div className={`flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-bottom-5 ${
        type === 'success' ? 'border-success/20 bg-success-soft text-success' : 'border-action/20 bg-action-soft text-action'
      }`}>
        {type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <XCircle size={20} className="shrink-0" />}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="shrink-0 opacity-50 hover:opacity-100"><X size={16} /></button>
      </div>
    </div>
  );
}