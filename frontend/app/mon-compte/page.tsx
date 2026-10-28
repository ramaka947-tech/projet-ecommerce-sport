'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  LogOut,
  Mail,
  MapPin,
  Package,
  PackageSearch,
  Pencil,
  LocateFixed,
  Phone,
  User,
  MessageSquare,
} from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getCustomerToken } from '@/lib/customer-auth';
import { getMyOrders, updateMyProfile } from '@/lib/api';
import { PhoneField } from '@/components/country-fields';
import BackButton from '@/components/back-button';
import { COUNTRIES, DEFAULT_COUNTRY, formatFullPhone, validatePhone } from '@/lib/countries';
import { getMyLocation } from '@/lib/geo';
import { useCurrency } from '@/lib/currency';
import { getRecentOrders, RecentOrder, trackingUrl } from '@/lib/recent-orders';

type OrderRow = {
  id: string | number;
  orderNumber: string;
  customerPhone: string;
  createdAt: string;
  total: number;
  status: string;
  items?: { quantity: number }[];
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-amber-100 text-amber-800',
  PREPARING: 'bg-amber-100 text-amber-800',
  TO_DELIVER: 'bg-ink text-white',
  DELIVERED: 'bg-success-soft text-success',
  CANCELLED: 'bg-action-soft text-action',
};

// 16 px (text-base) : évite le zoom automatique d'iOS. Hauteur 48 px sur mobile.
const inputClass =
  'min-h-12 w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-base text-ink placeholder:text-gray-500 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 md:min-h-0';

const cardClass = 'rounded-xl border border-line bg-white shadow-sm';

const fieldClass =
  'min-h-12 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-gray-500 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 md:min-h-0';

function splitPhone(full: string, fallback: string) {
  const compact = String(full || '').replace(/\s/g, '');
  if (compact.startsWith('+')) {
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => compact.startsWith(c.dial));
    if (match) return { country: match.code, number: compact.slice(match.dial.length) };
  }
  return { country: fallback, number: String(full || '') };
}

export default function AccountPage() {
  const router = useRouter();
  const { customer, logout, updateCustomer } = useCustomerAuth();
  const { formatPrice } = useCurrency();

  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [recents, setRecents] = useState<RecentOrder[]>([]);
  const [numberInput, setNumberInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loggedOut, setLoggedOut] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phoneCountry: DEFAULT_COUNTRY,
    phoneNumber: '',
    region: '',
    address: '',
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoInfo, setGeoInfo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedMsg, setSavedMsg] = useState(false);

  const profileRef = useRef<HTMLElement>(null);

  // Le stockage local peut lever une exception (mode privé iOS) : on protège.
  useEffect(() => {
    try {
      setHasToken(!!getCustomerToken());
    } catch {
      setHasToken(false);
    }
    try {
      setRecents(getRecentOrders());
    } catch {
      setRecents([]);
    }
  }, []);

  useEffect(() => {
    if (customer) {
      getMyOrders()
        .then((o) => setOrders(o as OrderRow[]))
        .catch(() => setOrders([]));
    }
  }, [customer]);

  // Le message « Informations mises à jour » disparaît tout seul (avec nettoyage du minuteur)
  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(false), 4000);
    return () => clearTimeout(t);
  }, [savedMsg]);

  const startEdit = () => {
    const countryCode =
      COUNTRIES.find((c) => c.name === customer?.country)?.code || DEFAULT_COUNTRY;
    const ph = splitPhone(customer?.phone || '', countryCode);
    setForm({
      name: customer?.name || '',
      phoneCountry: ph.country,
      phoneNumber: ph.number,
      region: customer?.region || '',
      address: customer?.address || '',
    });
    setSaveError('');
    setGeoError('');
    setGeoInfo('');
    setSavedMsg(false);
    setEditing(true);
  };

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const locate = async () => {
    setGeoLoading(true);
    setGeoError('');
    setGeoInfo('');
    try {
      const loc = await getMyLocation();
      const accuracyNote =
        loc.accuracy > 300
          ? ` Précision faible (environ ${Math.round(loc.accuracy)} m) : la position peut être décalée. Sur téléphone, c'est plus précis.`
          : '';

      if (!loc.resolved) {
        setGeoInfo(
          "Position trouvée, mais l'adresse n'a pas pu être déduite. Remplissez les champs à la main.",
        );
        return;
      }

      const found = [loc.road, loc.quartier].filter(Boolean).join(', ');

      setForm((f) => ({
        ...f,
        region: loc.region || f.region,
        address: f.address || found,
      }));

      setGeoInfo(
        loc.region
          ? `Position trouvée : ${[loc.quartier, loc.region].filter(Boolean).join(', ')}. Vérifiez et ajoutez un repère précis.${accuracyNote}`
          : `Position trouvée. Ville non détectée : complétez le champ manquant.${accuracyNote}`,
      );
    } catch (err) {
      setGeoError(
        err instanceof Error && err.message
          ? err.message
          : "Impossible de déterminer votre position. Remplissez les champs à la main.",
      );
    } finally {
      setGeoLoading(false);
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaveError('');

    const name = form.name.trim();
    if (name.length < 2) {
      setSaveError('Entrez votre nom complet.');
      return;
    }
    const phoneError = validatePhone(form.phoneCountry, form.phoneNumber);
    if (phoneError) {
      setSaveError(phoneError);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile({
        name,
        phone: formatFullPhone(form.phoneCountry, form.phoneNumber),
        region: form.region.trim(),
        address: form.address.trim(),
      });
      updateCustomer(updated);
      setEditing(false);
      setSavedMsg(true);
      // Sur téléphone, le formulaire était long : on remonte voir la confirmation
      requestAnimationFrame(() =>
        profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch (err) {
      setSaveError(
        err instanceof Error && err.message
          ? err.message
          : "Impossible d'enregistrer les modifications",
      );
    } finally {
      setSaving(false);
    }
  };

  const onTrack = (e: FormEvent) => {
    e.preventDefault();
    router.push(trackingUrl(numberInput.trim(), phoneInput.trim()));
  };

  if (hasToken === null || (hasToken && !customer)) {
    return (
      <main
        role="status"
        className="bg-canvas px-4 py-8 text-gray-500 sm:px-8 md:min-h-screen"
      >
        Chargement...
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="bg-canvas px-4 py-5 sm:px-8 sm:py-10 md:min-h-screen">
        <div className="mx-auto max-w-xl">
          <BackButton fallback="/" className="mb-4 md:mb-6" />

          {loggedOut && (
            <div
              role="status"
              className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-4 text-success"
            >
              <CheckCircle2 className="size-6 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Vous êtes déconnecté</p>
                <p className="text-sm">À bientôt sur AD Sport Solutions !</p>
              </div>
              <Link
                href="/"
                className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-lg border border-success px-3 text-sm font-semibold transition active:bg-white sm:w-auto md:min-h-0 md:py-1.5 md:hover:bg-white"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          )}

          <h1 className="mb-5 text-2xl font-bold text-ink sm:text-3xl md:mb-6">Mon compte</h1>

          <section className={`${cardClass} mb-5 p-5 sm:p-6 md:mb-6`}>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-ink">
              <PackageSearch className="size-5 text-action" aria-hidden="true" />
              Suivre ma commande
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Pas besoin de compte : entrez le numéro de commande et le téléphone utilisé.
            </p>
            <form onSubmit={onTrack} className="space-y-3">
              <div className="relative">
                <Package
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  required
                  name="orderNumber"
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Numéro de commande"
                  placeholder="Numéro de commande (CMD-...)"
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  required
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-label="Téléphone"
                  placeholder="Téléphone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="min-h-12 w-full touch-manipulation rounded-lg bg-action px-6 py-3 font-semibold text-white transition active:bg-action-dark md:min-h-0 md:hover:bg-action-dark"
              >
                Suivre ma commande
              </button>
            </form>

            {recents.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Clock className="size-4 text-action" aria-hidden="true" />
                  Sur cet appareil
                </p>
                <div className="space-y-2">
                  {recents.slice(0, 5).map((r) => (
                    <Link
                      key={r.orderNumber}
                      href={trackingUrl(r.orderNumber, r.phone)}
                      className="group flex min-h-12 touch-manipulation items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5 text-sm transition active:border-action md:min-h-0 md:hover:border-action"
                    >
                      <span className="min-w-0 break-all font-semibold text-ink">
                        {r.orderNumber}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-gray-500">
                        {new Date(r.date).toLocaleDateString('fr-FR')}
                        <ChevronRight
                          className="size-4 text-gray-400 transition md:group-hover:text-action"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-ink">
              <User className="size-5 text-action" aria-hidden="true" />
              Un compte, c&apos;est plus pratique
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Retrouvez vos commandes, votre panier et vos favoris sur n&apos;importe quel
              téléphone, même si vous changez d&apos;appareil.
            </p>
            <Link
              href="/compte/connexion"
              className="flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-action px-6 py-3 text-center font-semibold text-white transition active:bg-action-dark md:inline-block md:min-h-0 md:w-auto md:hover:bg-action-dark"
            >
              Se connecter ou créer un compte
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const firstName = String(customer.name || '').split(' ')[0];
  const location = [customer.address, customer.region].filter(Boolean).join(', ');

  return (
    <main className="bg-canvas px-4 py-5 sm:px-8 sm:py-10 md:min-h-screen">
      <div className="mx-auto max-w-5xl">
        <BackButton fallback="/" className="mb-4 md:mb-6" />

        <h1 className="break-words text-2xl font-bold text-ink sm:text-3xl">
          Bonjour {firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Retrouvez vos informations et suivez vos commandes.
        </p>

        <div
          className={`mt-5 grid items-start gap-5 md:mt-6 md:gap-6 ${
            editing ? '' : 'md:grid-cols-[1fr_1.8fr]'
          }`}
        >
          <section ref={profileRef} className={`${cardClass} min-w-0 scroll-mt-20 p-5 sm:p-6 md:scroll-mt-0`}>
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                <User className="size-7" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink">{customer.name}</p>
                <span className="mt-0.5 inline-block rounded-full bg-action-soft px-2.5 py-0.5 text-xs font-semibold text-action">
                  Client
                </span>
              </div>
            </div>

            {savedMsg && (
              <div
                role="status"
                className="mt-5 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-semibold text-success"
              >
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                Informations mises à jour
              </div>
            )}

            {editing ? (
              <form onSubmit={saveProfile} className="mt-5 border-t border-line pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-ink">
                      Nom complet
                    </label>
                    <input
                      id="edit-name"
                      name="name"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={handleField}
                      className={fieldClass}
                    />
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="edit-phone" className="mb-1.5 block text-sm font-semibold text-ink">
                      Téléphone
                    </label>
                    <PhoneField
                      id="edit-phone"
                      required
                      country={form.phoneCountry}
                      number={form.phoneNumber}
                      onCountryChange={(c) => setForm((f) => ({ ...f, phoneCountry: c }))}
                      onNumberChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
                      inputClass={fieldClass}
                    />
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="edit-region" className="mb-1.5 block text-sm font-semibold text-ink">
                      Ville
                    </label>
                    <input
                      id="edit-region"
                      name="region"
                      autoComplete="address-level2"
                      placeholder="Ex : Dakar"
                      value={form.region}
                      onChange={handleField}
                      className={fieldClass}
                    />
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="edit-address" className="mb-1.5 block text-sm font-semibold text-ink">
                      Adresse
                    </label>
                    <input
                      id="edit-address"
                      name="address"
                      autoComplete="street-address"
                      placeholder="Ex : villa n°12, en face de la pharmacie"
                      value={form.address}
                      onChange={handleField}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={locate}
                  disabled={geoLoading}
                  className="mt-4 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition active:border-action active:text-action disabled:opacity-50 sm:w-auto md:min-h-0 md:hover:border-action md:hover:text-action"
                >
                  <LocateFixed className="size-4" aria-hidden="true" />
                  {geoLoading ? 'Localisation en cours...' : 'Utiliser ma position'}
                </button>
                {geoInfo && (
                  <p
                    role="status"
                    className="mt-2 break-words rounded-lg bg-success-soft px-3 py-2 text-sm text-success"
                  >
                    {geoInfo}
                  </p>
                )}
                {geoError && (
                  <p
                    role="alert"
                    className="mt-2 break-words rounded-lg bg-action-soft px-3 py-2 text-sm text-alert"
                  >
                    {geoError}
                  </p>
                )}
                {geoInfo && (
                  <p className="mt-1 text-xs text-gray-500">Adresse estimée avec © OpenStreetMap</p>
                )}

                <p className="mt-4 text-xs text-gray-500">
                  L&apos;email sert à vous connecter, il ne peut pas être modifié ici.
                </p>

                {saveError && (
                  <p
                    role="alert"
                    className="mt-3 break-words rounded-lg bg-action-soft px-3 py-2 text-sm text-alert"
                  >
                    {saveError}
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className="min-h-12 touch-manipulation rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition active:bg-action-dark disabled:opacity-50 md:min-h-0 md:hover:bg-action-dark"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="min-h-12 touch-manipulation rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition active:bg-canvas md:min-h-0 md:hover:bg-canvas"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm text-gray-700">
                  {customer.email && (
                    <p className="flex items-start gap-3">
                      <Mail className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="min-w-0 break-all">{customer.email}</span>
                    </p>
                  )}
                  {customer.phone && (
                    <p className="flex items-start gap-3">
                      <Phone className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="min-w-0 break-words">{customer.phone}</span>
                    </p>
                  )}
                  {location && (
                    <p className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden="true" />
                      <span className="min-w-0 break-words">{location}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={startEdit}
                  className="mt-5 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-ink px-4 py-2 text-sm font-semibold text-ink transition active:bg-ink active:text-white md:min-h-0 md:hover:bg-ink md:hover:text-white"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Modifier mes informations
                </button>

                <Link
                  href="/mon-compte/messages"
                  className="mt-3 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-action bg-action/5 px-4 py-2 text-sm font-semibold text-action transition active:bg-action active:text-white md:min-h-0 md:hover:bg-action md:hover:text-white"
                >
                  <MessageSquare className="size-4" aria-hidden="true" />
                  Mes messages
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                logout();
                setHasToken(false);
                setOrders(null);
                setLoggedOut(true);
                window.scrollTo({ top: 0 });
              }}
              className="mt-3 inline-flex min-h-11 touch-manipulation items-center gap-2 text-sm font-semibold text-action transition active:text-action-dark md:mt-5 md:min-h-0 md:hover:text-action-dark"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Se déconnecter
            </button>
          </section>

          <section className={`${cardClass} min-w-0 p-5 sm:p-6`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
                <Package className="size-5 text-action" aria-hidden="true" />
                Mes commandes
              </h2>
              {orders && (
                <span className="shrink-0 text-sm text-gray-500">
                  {orders.length} commande{orders.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {orders === null ? (
              <p role="status" className="py-6 text-gray-500">
                Chargement...
              </p>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Aucune commande pour le moment.</p>
                <Link
                  href="/boutique"
                  className="mt-4 flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition active:bg-action-dark md:inline-block md:min-h-0 md:w-auto md:hover:bg-action-dark"
                >
                  Découvrir la boutique
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {orders.map((o) => {
                  const count = (o.items || []).reduce((s, i) => s + i.quantity, 0);
                  const ongoing = o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
                  return (
                    <Link
                      key={o.id}
                      href={trackingUrl(o.orderNumber, o.customerPhone)}
                      className="group -mx-2 flex touch-manipulation flex-wrap items-center gap-3 rounded-lg px-2 py-3.5 transition active:bg-canvas md:mx-0 md:px-0 md:active:bg-transparent"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                        <Package className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-semibold text-ink">{o.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(o.createdAt).toLocaleDateString('fr-FR')} · {count} article
                          {count > 1 ? 's' : ''}
                        </p>
                      </div>
                      {/* Mobile : prix et statut sur une 2e ligne, alignés sous le texte.
                          À partir de sm : une seule ligne, comme avant. */}
                      <div className="flex w-full items-center justify-between gap-3 pl-13 sm:ml-auto sm:w-auto sm:justify-start sm:pl-0">
                        <span className="whitespace-nowrap text-sm font-bold text-ink">
                          {formatPrice(o.total)}
                        </span>
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                            STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink transition md:group-hover:text-action">
                          <span className="hidden sm:inline">{ongoing ? 'Suivre' : 'Détails'}</span>
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link
              href="/suivi"
              className="mt-4 inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-ink underline transition active:text-action md:min-h-0 md:hover:text-action"
            >
              Suivre une commande passée sans compte
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}