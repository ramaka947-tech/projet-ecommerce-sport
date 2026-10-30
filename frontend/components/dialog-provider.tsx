'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type DialogState = {
  kind: 'confirm' | 'alert';
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
};

type DialogContextType = {
  confirmDialog: (options: string | ConfirmOptions) => Promise<boolean>;
  alertDialog: (message: string, title?: string) => Promise<void>;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog doit être utilisé dans <DialogProvider>');
  return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setDialog(null);
  }, []);

  const confirmDialog = useCallback((options: string | ConfirmOptions) => {
    const o: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setDialog({
        kind: 'confirm',
        title: o.title ?? 'Confirmation',
        message: o.message,
        confirmText: o.confirmText ?? 'Confirmer',
        cancelText: o.cancelText ?? 'Annuler',
        danger: o.danger ?? true,
      });
    });
  }, []);

  const alertDialog = useCallback((message: string, title = 'Information') => {
    return new Promise<void>((resolve) => {
      resolver.current = () => resolve();
      setDialog({
        kind: 'alert',
        title,
        message,
        confirmText: 'OK',
        cancelText: '',
        danger: false,
      });
    });
  }, []);

  // Échap = annuler
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, close]);

  return (
    <DialogContext.Provider value={{ confirmDialog, alertDialog }}>
      {children}

      {dialog && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="dialog-title" className="mb-2 text-lg font-bold text-gray-900">
              {dialog.title}
            </h3>
            <p className="mb-6 whitespace-pre-wrap text-sm text-gray-600">{dialog.message}</p>

            <div className="flex gap-3">
              {dialog.kind === 'confirm' && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition ${
                  dialog.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:opacity-90'
                }`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}