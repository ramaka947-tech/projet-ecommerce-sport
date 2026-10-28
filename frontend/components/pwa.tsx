'use client';
import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}

export function InstallAppButton({ className = '' }: { className?: string }) {
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || !!nav.standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const update = () => setCanInstall(!!deferred);
    update();
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  if (standalone) return null; // déjà installée
  if (!canInstall && !isIos) return null;

  const base =
    'inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-white transition active:bg-action-dark md:hover:bg-action-dark';

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    notify();
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={isIos && !canInstall ? () => setShowHelp((v) => !v) : install}
        className={base}
      >
        <Download size={18} aria-hidden="true" />
        Installer l&apos;application
      </button>
      {isIos && !canInstall && showHelp && (
        <p className="mt-2 text-sm text-white/70">
          Appuyez sur <Share size={14} className="inline align-text-bottom" aria-hidden="true" />{' '}
          <strong>Partager</strong> dans Safari, puis sur{' '}
          <strong>« Sur l&apos;écran d&apos;accueil »</strong>.
        </p>
      )}
    </div>
  );
}