'use client';

import { FormEvent, Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import BackButton from '@/components/back-button';

type HistoryEntry = { id: string | number; status: string; createdAt: string };

type OrderItem = {
  id: string | number;
  productName?: string;
  productImage?: string;
  product?: { name?: string; images?: string[] };
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
};

type TrackedOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  paymentMethod: string;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  items: OrderItem[];
  history?: HistoryEntry[];
};

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

// 16 px (text-base) : évite le zoom automatique d'iOS. Hauteur 48 px sur mobile.
const inputClass =
  'min-h-12 w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-base text-ink placeholder:text-gray-500 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 md:min-h-0';

const cardClass = 'rounded-xl border border-line bg-white shadow-sm';

const fmtDate = (d: string) => {
  const date = new Date(d);
  return `${date.toLocaleDateString('fr-FR')} · ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const errMsg = (e: unknown, fallback: string) =>
  e instanceof Error && e.message ? e.message : fallback;

// Images Cloudinary : version légère adaptée à l'écran
const cld = (src: string, w: number) =>
  src.includes('/upload/')
    ? src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`)
    : src;

const cldSrcSet = (src: string) =>
  src.includes('/upload/')
    ? [128, 192, 256].map((w) => `${cld(src, w)} ${w}w`).join(', ')
    : undefined;

function TrackingContent() {
  const params = useSearchParams();
  const { formatPrice } = useCurrency();

  const [numberInput, setNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
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
      const data = (await trackOrder(n, t)) as TrackedOrder;
      setOrder(data);
      setPhone(t);
      rememberOrder(data.orderNumber, t);
      setRecents(getRecentOrders());
      // Sur téléphone, on arrive en haut du suivi même si on a tapé en bas de la liste
      window.scrollTo({ top: 0 });
    } catch (e) {
      setOrder(null);
      setError(errMsg(e, 'Commande introuvable'));
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
    if (loading) return;
    // Les claviers mobiles ajoutent souvent un espace à la fin : on le retire
    search(numberInput.trim(), phoneInput.trim());
  };

  const cancel = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    setError('');
    try {
      await cancelTrackedOrder(order.orderNumber, phone);
      await search(order.orderNumber, phone);
      setConfirmCancel(false);
    } catch (e) {
      setError(errMsg(e, "Impossible d'annuler la commande"));
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
    window.scrollTo({ top: 0 });
  };

  // ------------------------------------------------------------------
  // Formulaire (aucune commande affichée)
  // ------------------------------------------------------------------
  if (!order) {
    return (
      <main className="bg-canvas px-4 py-5 sm:px-8 sm:py-10 md:min-h-screen">
        <div className="mx-auto max-w-xl">
          <BackButton fallback="/boutique" />

          <div className="mt-5 flex items-center gap-4 md:mt-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-action text-white">
              <PackageSearch className="size-7" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-ink text-balance sm:text-3xl">
                Suivre ma commande
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Entrez le numéro reçu à la confirmation et le téléphone utilisé pour commander.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className={`${cardClass} mt-5 space-y-5 p-5 sm:p-6 md:mt-6`}>
            <div>
              <label htmlFor="orderNumber" className="mb-1.5 block text-sm font-semibold text-ink">
                Numéro de commande
              </label>
              <div className="relative">
                <Package
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  id="orderNumber"
                  name="orderNumber"
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
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
                <Phone
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
                  aria-hidden="true"
                />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="77 123 45 67"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 break-words rounded-lg bg-action-soft px-3 py-2 text-sm text-alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full touch-manipulation rounded-lg bg-action px-6 py-3 font-semibold text-white transition active:bg-action-dark disabled:opacity-50 md:min-h-0 md:hover:bg-action-dark"
            >
              {loading ? 'Recherche...' : 'Suivre ma commande'}
            </button>
          </form>

          {recents.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
                <Clock className="size-5 text-action" aria-hidden="true" />
                Commandes passées sur cet appareil
              </h2>
              <div className="space-y-2">
                {recents.map((r) => (
                  <button
                    key={r.orderNumber}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setNumberInput(r.orderNumber);
                      setPhoneInput(r.phone);
                      search(r.orderNumber, r.phone);
                    }}
                    className={`${cardClass} group flex min-h-14 w-full touch-manipulation items-center gap-3 px-4 py-3 text-left transition active:border-action disabled:opacity-50 md:hover:border-action`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                      <Package className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{r.orderNumber}</span>
                      <span className="block text-xs text-gray-500">
                        {new Date(r.date).toLocaleDateString('fr-FR')}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-gray-500 transition md:group-hover:text-action"
                      aria-hidden="true"
                    />
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
    const h = order.history?.find((x) => x.status === status);
    if (h) return h.createdAt;
    if (status === 'NEW') return order.createdAt;
    return null;
  };

  const history: HistoryEntry[] =
    order.history && order.history.length > 0
      ? [...order.history].reverse()
      : [{ id: 'created', status: 'NEW', createdAt: order.createdAt }];

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
        `Bonjour, je vous écris au sujet de ma commande ${order.orderNumber}.`,
      )}`
    : '';

  const paymentLabel = order.paymentMethod === 'cash' ? 'à la livraison' : order.paymentMethod;

  // Couleur de la barre du haut selon le statut
  const topBar = cancelled ? 'bg-action' : delivered ? 'bg-success' : 'bg-amber-400';

  return (
    <main className="bg-canvas px-4 py-5 sm:px-8 sm:py-10 md:min-h-screen">
      <div className="mx-auto max-w-4xl">
        {/* Barre de navigation de la page */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <BackButton fallback="/boutique" />
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 touch-manipulation items-center gap-2 text-sm font-semibold text-ink transition active:text-action md:min-h-0 md:hover:text-action"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Suivre une autre commande
          </button>
        </div>

        {/* En-tête + progression */}
        <section className={`${cardClass} mt-4 overflow-hidden`}>
          <div className={`h-1.5 w-full ${topBar}`} />
          <div className="p-5 sm:p-6">
            {/* Mobile : le statut passe AU-DESSUS du numéro (c'est l'info qu'on cherche).
                Dès sm : mise en page d'origine. */}
            <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={`hidden size-14 shrink-0 items-center justify-center rounded-full sm:flex ${
                    cancelled
                      ? 'bg-action-soft text-action'
                      : delivered
                        ? 'bg-success-soft text-success'
                        : 'bg-amber-100 text-amber-500'
                  }`}
                >
                  {cancelled ? (
                    <XCircle className="size-7" aria-hidden="true" />
                  ) : delivered ? (
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  ) : (
                    <Package className="size-7" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="break-all text-2xl font-bold text-ink sm:text-3xl">
                    {order.orderNumber}
                  </h1>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-4" aria-hidden="true" />
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CreditCard className="size-4" aria-hidden="true" />
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
              <div
                role="status"
                className="mt-5 flex items-center gap-3 rounded-lg bg-action-soft p-3 text-sm text-action"
              >
                <XCircle className="size-5 shrink-0" aria-hidden="true" />
                {MESSAGES.CANCELLED}
              </div>
            ) : (
              <>
                {/* Mobile : étapes en liste verticale (5 colonnes seraient trop étroites).
                    Dès sm : 5 colonnes horizontales, comme avant. */}
                <ol className="mt-6 flex flex-col sm:mt-8 sm:grid sm:grid-cols-5 sm:gap-1">
                  {STEPS.map((s, i) => {
                    const done = i < current || delivered;
                    const active = i === current && !delivered;
                    const date = stepDate(s);
                    const isLast = i === STEPS.length - 1;
                    return (
                      <li
                        key={s}
                        className={`relative flex items-start gap-3 sm:flex-col sm:items-center sm:gap-0 sm:pb-0 sm:text-center ${
                          isLast ? '' : 'pb-5'
                        }`}
                      >
                        {/* Trait vertical (mobile) */}
                        {!isLast && (
                          <span
                            aria-hidden="true"
                            className={`absolute bottom-0 left-4 top-8 w-0.5 -translate-x-1/2 sm:hidden ${
                              i + 1 <= current || delivered ? 'bg-success' : 'bg-line'
                            }`}
                          />
                        )}
                        {/* Trait horizontal (dès sm) */}
                        {i > 0 && (
                          <span
                            aria-hidden="true"
                            className={`absolute right-1/2 top-4 hidden h-0.5 w-full sm:block ${
                              i <= current || delivered ? 'bg-success' : 'bg-line'
                            }`}
                          />
                        )}
                        <span
                          className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            done
                              ? 'bg-success text-white'
                              : active
                                ? 'bg-amber-400 text-ink ring-4 ring-amber-100'
                                : 'border-2 border-line bg-white text-gray-500'
                          }`}
                        >
                          {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : i + 1}
                        </span>
                        <span className="flex min-h-8 min-w-0 flex-col justify-center sm:mt-2 sm:min-h-0 sm:items-center">
                          <span
                            className={`text-sm leading-tight ${
                              done || active ? 'font-semibold text-ink' : 'font-medium text-gray-500'
                            }`}
                          >
                            {STATUS_LABELS[s]}
                            {active && <span className="sr-only"> (étape actuelle)</span>}
                          </span>
                          {date && (done || active) && (
                            <span className="text-xs text-gray-500">{fmtDate(date)}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <div
                  role="status"
                  className={`mt-6 flex items-center gap-3 rounded-lg p-3 text-sm ${
                    delivered ? 'bg-success-soft text-success' : 'bg-amber-50 text-ink'
                  }`}
                >
                  {delivered ? (
                    <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Info className="size-5 shrink-0 text-amber-500" aria-hidden="true" />
                  )}
                  {MESSAGES[order.status]}
                </div>
              </>
            )}
          </div>
        </section>

        <div className="mt-5 grid gap-5 md:mt-6 md:grid-cols-[1.4fr_1fr] md:gap-6">
          {/* Articles */}
          <section className={`${cardClass} h-fit min-w-0 p-5 sm:p-6`}>
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ink">
              <Package className="size-5 text-action" aria-hidden="true" />
              Articles
            </h2>
            <div className="divide-y divide-line">
              {(order.items ?? []).map((item) => {
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
                          src={cld(image, 128)}
                          srcSet={cldSrcSet(image)}
                          sizes="64px"
                          alt={name}
                          loading="lazy"
                          decoding="async"
                          className="h-auto max-h-16 w-auto max-w-full"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 break-words font-semibold text-ink sm:line-clamp-1">
                        {name}
                      </p>
                      <p className="break-words text-xs text-gray-500">{details}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-ink">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 space-y-2 rounded-lg bg-canvas p-3 text-sm">
              <div className="flex justify-between gap-3 text-gray-600">
                <span>Livraison</span>
                <span className="whitespace-nowrap">{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-2 text-lg font-bold text-ink">
                <span>Total</span>
                <span className="whitespace-nowrap">{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Livraison + historique */}
          <div className="min-w-0 space-y-5 md:space-y-6">
            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ink">
                <MapPin className="size-5 text-action" aria-hidden="true" />
                Livraison
              </h2>
              <p className="break-words font-semibold text-ink">{order.customerName}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{order.customerPhone}</span>
              </p>
              <p className="mt-1 flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {order.customerAddress}, {order.city}
                </span>
              </p>
            </section>

            <section className={`${cardClass} p-5 sm:p-6`}>
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-ink">
                <Clock className="size-5 text-action" aria-hidden="true" />
                Historique
              </h2>
              <ul className="text-sm">
                {history.map((h, index) => {
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
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white ${
                          isCancelled ? 'bg-action' : pending ? 'bg-amber-400' : 'bg-success'
                        }`}
                      >
                        {isCancelled ? (
                          <XCircle className="size-3" aria-hidden="true" />
                        ) : pending ? null : (
                          <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
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
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 break-words rounded-lg bg-action-soft px-3 py-2 text-sm text-alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">{error}</span>
          </p>
        )}

        {/* Annulation / contact */}
        {!cancelled && !delivered && (
          <section className={`${cardClass} mt-5 p-5 sm:p-6 md:mt-6`}>
            {order.status === 'NEW' ? (
              confirmCancel ? (
                <div>
                  <p className="font-semibold text-ink">Annuler cette commande ?</p>
                  <p className="mt-1 text-sm text-gray-500">Cette action est définitive.</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-2">
                    <button
                      type="button"
                      onClick={cancel}
                      disabled={cancelling}
                      className="min-h-12 touch-manipulation rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white transition active:bg-action-dark disabled:opacity-50 md:min-h-0 md:hover:bg-action-dark"
                    >
                      {cancelling ? 'Annulation...' : 'Oui, annuler'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(false)}
                      className="min-h-12 touch-manipulation rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition active:bg-canvas md:min-h-0 md:hover:bg-canvas"
                    >
                      Non, garder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                      <AlertCircle className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Vous pouvez annuler votre commande</p>
                      <p className="mt-1 max-w-md text-sm text-gray-500">
                        Si vous changez d&apos;avis, vous pouvez annuler avant qu&apos;elle ne soit
                        confirmée par notre équipe.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-action px-4 py-2 text-sm font-semibold text-action transition active:bg-action-soft sm:w-auto md:min-h-0 md:hover:bg-action-soft"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
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
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition active:border-action active:text-action sm:w-auto md:min-h-0 md:hover:border-action md:hover:text-action"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    Écrire sur WhatsApp
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        <Link
          href="/boutique"
          className="mt-5 flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-ink bg-white px-4 py-2.5 text-sm font-semibold text-ink transition active:bg-ink active:text-white sm:inline-flex sm:w-auto md:mt-6 md:min-h-0 md:hover:bg-ink md:hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Continuer mes achats
        </Link>
      </div>
    </main>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <main role="status" className="bg-canvas p-8 text-gray-500 md:min-h-screen">
          Chargement...
        </main>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}