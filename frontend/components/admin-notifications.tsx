'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ClipboardList, MessagesSquare, Star, X } from 'lucide-react';
import { getOrders, getAdminMessages, getReviewsAdmin } from '@/lib/api';

type Kind = 'orders' | 'messages' | 'reviews';
type IdMap = Record<Kind, string[]>;

const KINDS: Kind[] = ['orders', 'messages', 'reviews'];
const EMPTY: IdMap = { orders: [], messages: [], reviews: [] };
const STORAGE_KEY = 'admin_notif_dismissed';

function loadDismissed(): IdMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw);
    return {
      orders: Array.isArray(p.orders) ? p.orders : [],
      messages: Array.isArray(p.messages) ? p.messages : [],
      reviews: Array.isArray(p.reviews) ? p.reviews : [],
    };
  } catch {
    return EMPTY;
  }
}

function saveDismissed(d: IdMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  // Éléments qui attendent un traitement (renvoyés par l'API)
  const [pending, setPending] = useState<IdMap>(EMPTY);
  // Éléments que l'admin a déjà vus ou effacés (gardés dans ce navigateur)
  const [dismissed, setDismissed] = useState<IdMap>(EMPTY);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const refresh = useCallback(async () => {
    const [orders, messages, reviews] = await Promise.allSettled([
      getOrders(),
      getAdminMessages(),
      getReviewsAdmin(),
    ]);

    // Renvoie null si la requête a échoué (on garde alors l'état précédent)
    const ids = (r: PromiseSettledResult<any>, test: (x: any) => boolean): string[] | null =>
      r.status === 'fulfilled' && Array.isArray(r.value)
        ? r.value.filter(test).map((x: any) => String(x.id))
        : null;

    // ⚠️ à adapter si tes champs ont d'autres noms
    const next: Record<Kind, string[] | null> = {
      orders: ids(orders, (o) => o.status === 'NEW'),
      messages: ids(messages, (m) => m.isRead === false || m.read === false),
      reviews: ids(reviews, (r) => r.isApproved === false || r.approved === false),
    };

    setPending((prev) => ({
      orders: next.orders ?? prev.orders,
      messages: next.messages ?? prev.messages,
      reviews: next.reviews ?? prev.reviews,
    }));

    // Nettoyage : on oublie les éléments qui ne sont plus en attente
    setDismissed((prev) => {
      const pruned: IdMap = { ...prev };
      let changed = false;
      for (const k of KINDS) {
        const list = next[k];
        if (list === null) continue;
        const kept = prev[k].filter((id) => list.includes(id));
        if (kept.length !== prev[k].length) {
          pruned[k] = kept;
          changed = true;
        }
      }
      if (changed) saveDismissed(pruned);
      return changed ? pruned : prev;
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

  // Marque comme « vus » tous les éléments actuellement en attente de ces catégories
  const dismiss = (kinds: Kind[]) => {
    setDismissed((prev) => {
      const n: IdMap = { ...prev };
      for (const k of kinds) n[k] = Array.from(new Set([...prev[k], ...pending[k]]));
      saveDismissed(n);
      return n;
    });
  };

  const count = (k: Kind) => pending[k].filter((id) => !dismissed[k].includes(id)).length;
  const counts: Record<Kind, number> = {
    orders: count('orders'),
    messages: count('messages'),
    reviews: count('reviews'),
  };
  const total = counts.orders + counts.messages + counts.reviews;

  const rows: { kind: Kind; href: string; label: string; icon: any }[] = [
    { kind: 'orders', href: '/admin/commandes', label: 'Commandes en attente', icon: ClipboardList },
    { kind: 'messages', href: '/admin/messages', label: 'Messages non lus', icon: MessagesSquare },
    { kind: 'reviews', href: '/admin/avis', label: 'Avis à approuver', icon: Star },
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
          <div className="flex items-center justify-between px-3 py-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Notifications</p>
            {total > 0 && (
              <button
                type="button"
                onClick={() => dismiss(KINDS)}
                className="text-xs font-semibold text-action hover:underline"
              >
                Tout effacer
              </button>
            )}
          </div>

          {total === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-ink/50">Rien de nouveau 🎉</p>
          ) : (
            rows
              .filter((r) => counts[r.kind] > 0)
              .map(({ kind, href, label, icon: Icon }) => (
                <div key={kind} className="flex items-center rounded-lg hover:bg-canvas">
                  <Link
                    href={href}
                    onClick={() => { dismiss([kind]); setOpen(false); }}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 hover:text-ink md:min-h-0"
                  >
                    <Icon size={16} className="shrink-0 text-action" />
                    <span className="flex-1 truncate">{label}</span>
                    <span className="rounded-full bg-action/10 px-2 py-0.5 text-xs font-bold text-action">
                      {counts[kind]}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismiss([kind])}
                    aria-label={`Effacer : ${label}`}
                    className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-lg text-ink/40 hover:bg-white hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}