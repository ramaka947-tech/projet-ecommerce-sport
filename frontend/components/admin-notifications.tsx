'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ClipboardList, MessagesSquare, Star } from 'lucide-react';
import { getOrders, getAdminMessages, getReviewsAdmin } from '@/lib/api';

type Counts = { orders: number; messages: number; reviews: number };

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ orders: 0, messages: 0, reviews: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const [orders, messages, reviews] = await Promise.allSettled([
      getOrders(),
      getAdminMessages(),
      getReviewsAdmin(),
    ]);

    const list = (r: PromiseSettledResult<any>) =>
      r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];

    setCounts({
      // ⚠️ à adapter si tes champs ont d'autres noms (voir plus bas)
      orders: list(orders).filter((o: any) => o.status === 'NEW').length,
      messages: list(messages).filter((m: any) => m.isRead === false || m.read === false).length,
      reviews: list(reviews).filter((r: any) => r.isApproved === false || r.approved === false).length,
    });
  }, []);

  // Charge au départ, puis toutes les 60 s (seulement si l'onglet est visible)
  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 60000);
    return () => clearInterval(id);
  }, [refresh]);

  // Ferme au clic extérieur / Échap
  useEffect(() => {
    if (!open) return;
    const onClick = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const total = counts.orders + counts.messages + counts.reviews;

  const rows = [
    { href: '/admin/commandes', label: 'Commandes en attente', n: counts.orders, icon: ClipboardList },
    { href: '/admin/messages', label: 'Messages non lus', n: counts.messages, icon: MessagesSquare },
    { href: '/admin/avis', label: 'Avis à approuver', n: counts.reviews, icon: Star },
  ];

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) refresh(); }}
        aria-label={`Notifications${total ? ` (${total})` : ''}`}
        className="relative flex size-11 items-center justify-center rounded-lg text-ink/60 transition hover:bg-canvas hover:text-ink md:size-auto md:p-2"
      >
        <Bell size={20} />
        {total > 0 && (
          <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-bold leading-4 text-white md:right-0.5 md:top-0.5">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-line bg-white p-1.5 shadow-lg">
          <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink/40">Notifications</p>
          {total === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-ink/50">Rien de nouveau 🎉</p>
          ) : (
            rows.filter((r) => r.n > 0).map(({ href, label, n, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-canvas hover:text-ink md:min-h-0"
              >
                <Icon size={16} className="shrink-0 text-action" />
                <span className="flex-1">{label}</span>
                <span className="rounded-full bg-action/10 px-2 py-0.5 text-xs font-bold text-action">{n}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}