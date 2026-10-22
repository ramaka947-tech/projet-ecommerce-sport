'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  MapPin,
  MessageCircle,
  Package,
  PackageSearch,
  Phone,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { trackOrder, cancelTrackedOrder, getSettings } from '@/lib/api';
import { useCurrency } from '@/lib/currency';
import { getRecentOrders, rememberOrder, RecentOrder } from '@/lib/recent-orders';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STEPS = ['NEW', 'CONFIRMED', 'PREPARING', 'TO_DELIVER', 'DELIVERED'];

const MESSAGES: Record<string, string> = {
  NEW: 'Votre commande a bien été reçue. Nous allons la confirmer très bientôt.',
  CONFIRMED: 'Votre commande est confirmée.',
  PREPARING: 'Votre commande est en cours de préparation.',
  TO_DELIVER: 'Votre commande est prête et va être livrée.',
  DELIVERED: 'Votre commande a été livrée. Merci pour votre confiance !',
  CANCELLED: 'Cette commande a été annulée.',
};

const inputClass =
  'w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';

const cardClass = 'rounded-xl border border-line bg-white shadow-sm';

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.toLocaleDateString('fr-FR')} · ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

// Bouton de retour : revient à la page précédente, sinon va à la boutique
function BackLink({ label = 'Retour' }: { label?: string }) {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/boutique');
    }
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

function TrackingContent() {
  const params = useSearchParams();
  const { formatPrice } = useCurrency();

  const [numberInput, setNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [phone, setPhone] = useState(''); // téléphone utilisé pour la recherche
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [recents, setRecents] = useState<RecentOrder[]>([]);
  const [whatsapp, setWhatsapp] = useState('');

  const search = useCallback(async (n: string, t: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await trackOrder(n, t);
      setOrder(data);
      setPhone(t);
      rememberOrder(data.orderNumber, t);
      setRecents(getRecentOrders());
    } catch (e: any) {
      setOrder(null);
      setError(e.message || 'Commande introuvable');
    } finally {
      setLoading(false);
    }
  }, []);

  const qn = params.get('n') || '';
  const qt = params.get('t') || '';

  useEffect(() => {
    setRecents(getRecentOrders());
    getSettings()
      .then((s) => {
        const raw = String(s.whatsapp || s.whatsapp_number || s.phone || '');
        setWhatsapp(raw.replace(/\D/g, ''));
      })
      .catch(() => {});
  }, []);

  // Arrivée avec un lien (confirmation, compte, appareil) : on lance la recherche
  useEffect(() => {
    if (qn && qt) {
      setNumberInput(qn);
      setPhoneInput(qt);
      search(qn, qt);
    }
  }, [qn, qt, search]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    search(numberInput, phoneInput);
  };

  const cancel = async () => {
    if (!order) return;
    setCancelling(true);
    setError('');
    try {
      await cancelTrackedOrder(order.orderNumber, phone);
      await search(order.orderNumber, phone);
      setConfirmCancel(false);
    } catch (e: any) {
      setError(e.message || "Impossible d'annuler la commande");
    } finally {
      setCancelling(false);
    }
  };

  const reset = () => {
    setOrder(null);
    setError('');
    setConfirmCancel(false);
    setNumberInput('');
    setPhoneInput('');
  };

  // ------------------------------------------------------------------
  // Formulaire (aucune commande affichée)
  // ------------------------------------------------------------------
  if (!order) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-xl">
          <BackLink />

          <div className="mt-6 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-action text-white">
              <PackageSearch className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-ink sm:text-3xl">Suivre ma commande</h1>
              <p className="mt-1 text-sm text-gray-500">
                Entrez le numéro reçu à la confirmation et le téléphone utilisé pour commander.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className={`${cardClass} mt-6 space-y-5 p-5 sm:p-6`}>
            <div>
              <label htmlFor="orderNumber" className="mb-1.5 block text-sm font-semibold text-ink">
                Numéro de commande
              </label>
              <div className="relative">
                <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="orderNumber"
                  required
                  placeholder="CMD-12345678123"
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-ink">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="77 123 45 67"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-lg bg-action-soft px-3 py-2 text-sm text-alert">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white transition hover:bg-action-dark disabled:opacity-50"
            >
              {loading ? 'Recherche...' : 'Suivre ma commande'}
            </button>
          </form>

          {recents.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
                <Clock className="h-5 w-5 text-action" />
                Commandes passées sur cet appareil
              </h2>
              <div className="space-y-2">
                {recents.map((r) => (
                  <button
                    key={r.orderNumber}
                    type="button"
                    onClick={() => {
                      setNumberInput(r.orderNumber);
                      setPhoneInput(r.phone);
                      search(r.orderNumber, r.phone);
                    }}
                    className={`${cardClass} group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:border-action`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                      <Package className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{r.orderNumber}</span>
                      <span className="block text-xs text-gray-500">
                        {new Date(r.date).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 transition group-hover:text-action" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Détail de la commande
  // ------------------------------------------------------------------
  const cancelled = order.status === 'CANCELLED';
  const delivered = order.status === 'DELIVERED';
  const current = STEPS.indexOf(order.status);

  const stepDate = (status: string): string | null => {
    const h = order.history?.find((x: any) => x.status === status);
    if (h) return h.createdAt;
    if (status === 'NEW') return order.createdAt;
    return null;
  };

  const history: any[] =
    order.history && order.history.length > 0
      ? [...order.history].reverse()
      : [{ id: 'created', status: 'NEW', createdAt: order.createdAt }];

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Bonjour, je vous écris au sujet de ma commande ${order.orderNumber}.`,
      )}`
    : '';

  const paymentLabel =
    order.paymentMethod === 'cash' ? 'à la livraison' : order.paymentMethod;

  // Couleur de la barre du haut selon le statut
  const topBar = cancelled ? 'bg-action' : delivered ? 'bg-success' : 'bg-amber-400';

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Barre de navigation de la page */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackLink />
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-action"
          >
            <RotateCcw className="h-4 w-4" />
            Suivre une autre commande
          </button>
        </div>

        {/* En-tête + progression */}
        <section className={`${cardClass} mt-4 overflow-hidden`}>
          <div className={`h-1.5 w-full ${topBar}`} />
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div
                  className={`hidden h-14 w-14 shrink-0 items-center justify-center rounded-full sm:flex ${
                    cancelled
                      ? 'bg-action-soft text-action'
                      : delivered
                        ? 'bg-success-soft text-success'
                        : 'bg-amber-100 text-amber-500'
                  }`}
                >
                  {cancelled ? (
                    <XCircle className="h-7 w-7" />
                  ) : delivered ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : (
                    <Package className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <h1 className="break-all text-2xl font-bold text-ink sm:text-3xl">
                    {order.orderNumber}
                  </h1>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4" />
                      Paiement : <span className="capitalize">{paymentLabel}</span>
                    </span>
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  cancelled
                    ? 'bg-action-soft text-action'
                    : delivered
                      ? 'bg-success-soft text-success'
                      : 'bg-amber-100 text-amber-800'
                }`}
              >
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            {cancelled ? (
              <div className="mt-5 flex items-center gap-3 rounded-lg bg-action-soft p-3 text-sm text-action">
                <XCircle className="h-5 w-5 shrink-0" />
                {MESSAGES.CANCELLED}
              </div>
            ) : (
              <>
                <ol className="mt-8 grid grid-cols-5 gap-1">
                  {STEPS.map((s, i) => {
                    const done = i < current || delivered;
                    const active = i === current && !delivered;
                    const date = stepDate(s);
                    return (
                      <li key={s} className="relative flex flex-col items-center text-center">
                        {i > 0 && (
                          <span
                            className={`absolute right-1/2 top-4 h-0.5 w-full ${
                              i <= current || delivered ? 'bg-success' : 'bg-line'
                            }`}
                          />
                        )}
                        <span
                          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                            done
                              ? 'bg-success text-white'
                              : active
                                ? 'bg-amber-400 text-ink ring-4 ring-amber-100'
                                : 'border-2 border-line bg-white text-gray-400'
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                        </span>
                        <span
                          className={`mt-2 text-[11px] leading-tight sm:text-sm ${
                            done || active ? 'font-semibold text-ink' : 'font-medium text-gray-500'
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </span>
                        <span className="text-[10px] text-gray-500 sm:text-xs">
                          {date && (done || active) ? fmtDate(date) : ''}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <div
                  className={`mt-6 flex items-center gap-3 rounded-lg p-3 text-sm ${
                    delivered ? 'bg-success-soft text-success' : 'bg-amber-50 text-ink'
                  }`}
                >
                  {delivered ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <Info className="h-5 w-5 shrink-0 text-amber-500" />
                  )}
                  {MESSAGES[order.status]}
                </div>
              </>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          {/* Articles */}
          <section className={`${cardClass} h-fit p-5 sm:p-6`}>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ink">
              <Package className="h-5 w-5 text-action" />
              Articles
            </h2>
            <div className="divide-y divide-line">
              {order.items.map((item: any) => {
                const name = item.productName || item.product?.name || 'Produit';
                const image = item.productImage || item.product?.images?.[0];
                const details = [
                  item.size ? `Taille ${item.size}` : '',
                  item.color ? `Couleur ${item.color}` : '',
                  `Quantité ${item.quantity}`,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    {/* Image : garde ses proportions, jamais rognée */}
                    <div className="flex w-16 shrink-0 items-center justify-center">
                      {image && (
                        <img
                          src={image}
                          alt={name}
                          className="h-auto max-h-16 w-auto max-w-full"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{name}</p>
                      <p className="text-xs text-gray-500">{details}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-ink">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 space-y-2 rounded-lg bg-canvas p-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-lg font-bold text-ink">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Livraison + historique */}
          <div className="space-y-6">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ink">
                <MapPin className="h-5 w-5 text-action" />
                Livraison
              </h2>
              <p className="font-semibold text-ink">{order.customerName}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 shrink-0" />
                {order.customerPhone}
              </p>
              <p className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {order.customerAddress}, {order.city}
                </span>
              </p>
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ink">
                <Clock className="h-5 w-5 text-action" />
                Historique
              </h2>
              <ul className="text-sm">
                {history.map((h: any, index: number) => {
                  const isCancelled = h.status === 'CANCELLED';
                  const isLatest = index === 0;
                  const isFinalDone = h.status === 'DELIVERED';
                  const pending = isLatest && !isCancelled && !isFinalDone;
                  return (
                    <li
                      key={h.id}
                      className="flex items-start gap-3 border-b border-line py-2.5 last:border-b-0"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                          isCancelled ? 'bg-action' : pending ? 'bg-amber-400' : 'bg-success'
                        }`}
                      >
                        {isCancelled ? (
                          <XCircle className="h-3 w-3" />
                        ) : pending ? null : (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        )}
                      </span>
                      <div>
                        <p
                          className={`font-semibold ${
                            isFinalDone ? 'text-success' : isCancelled ? 'text-action' : 'text-ink'
                          }`}
                        >
                          {h.id === 'created'
                            ? 'Commande reçue'
                            : STATUS_LABELS[h.status] || h.status}
                        </p>
                        <p className="text-xs text-gray-500">{fmtDate(h.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-action-soft px-3 py-2 text-sm text-alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* Annulation / contact */}
        {!cancelled && !delivered && (
          <section className={`${cardClass} mt-6 p-5 sm:p-6`}>
            {order.status === 'NEW' ? (
              confirmCancel ? (
                <div>
                  <p className="font-semibold text-ink">Annuler cette commande ?</p>
                  <p className="mt-1 text-sm text-gray-500">Cette action est définitive.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={cancel}
                      disabled={cancelling}
                      className="rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-dark disabled:opacity-50"
                    >
                      {cancelling ? 'Annulation...' : 'Oui, annuler'}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas"
                    >
                      Non, garder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                      <AlertCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">Vous pouvez annuler votre commande</p>
                      <p className="mt-1 max-w-md text-sm text-gray-500">
                        Si vous changez d'avis, vous pouvez annuler avant qu'elle ne soit
                        confirmée par notre équipe.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-action px-4 py-2 text-sm font-semibold text-action transition hover:bg-action-soft"
                  >
                    <Trash2 className="h-4 w-4" />
                    Annuler ma commande
                  </button>
                </div>
              )
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Pour modifier ou annuler cette commande, contactez-nous.
                </p>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-action hover:text-action"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Écrire sur WhatsApp
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        <Link
          href="/boutique"
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuer mes achats
        </Link>
      </div>
    </main>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-canvas p-8">Chargement...</main>}>
      <TrackingContent />
    </Suspense>
  );
}