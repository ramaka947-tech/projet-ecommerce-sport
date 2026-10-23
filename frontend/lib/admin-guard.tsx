'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  isAuthenticated, touchActivity, getLastActivity,
  removeToken, refreshToken, IDLE_LIMIT_MS,
} from '@/lib/auth';

const CHECK_EVERY_MS = 30_000;
const REFRESH_EVERY_MS = 5 * 60_000;
const EVENTS = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'] as const;

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const lastRefresh = useRef(Date.now());
  const lastTouch = useRef(0);

  useEffect(() => {
    const kick = () => {
      removeToken();
      setChecked(false);
      router.replace('/admin/login');
    };

    const verify = () => {
      if (!isAuthenticated()) {
        kick();
        return false;
      }
      return true;
    };

    if (!verify()) return;
    setChecked(true);

    const onActivity = () => {
      const now = Date.now();
      if (now - lastTouch.current < 1000) return;
      // Après une veille, une simple activité ne doit pas ressusciter la session
      if (now - getLastActivity() > IDLE_LIMIT_MS) {
        verify();
        return;
      }
      lastTouch.current = now;
      touchActivity();
    };

    const tick = async () => {
      if (!verify()) return;
      const now = Date.now();
      const activeSinceRefresh = getLastActivity() > lastRefresh.current;
      if (activeSinceRefresh && now - lastRefresh.current >= REFRESH_EVERY_MS) {
        lastRefresh.current = now;
        if (!(await refreshToken())) kick();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') verify();
    };
    const onPageShow = () => { verify(); }; // bouton "précédent" / cache du navigateur

    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onPageShow);
    const timer = setInterval(tick, CHECK_EVERY_MS);

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
      clearInterval(timer);
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}