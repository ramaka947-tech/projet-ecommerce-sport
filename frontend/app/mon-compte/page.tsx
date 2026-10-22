'use client';

import { FormEvent, useEffect, useState } from 'react';
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
  ArrowLeft, // Ajout de l'icône
} from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getCustomerToken } from '@/lib/customer-auth';
import { getMyOrders, updateMyProfile } from '@/lib/api';
import { PhoneField } from '@/components/country-fields';
import { COUNTRIES, DEFAULT_COUNTRY, formatFullPhone, validatePhone } from '@/lib/countries';
import { getMyLocation } from '@/lib/geo';
import { useCurrency } from '@/lib/currency';
import { getRecentOrders, RecentOrder, trackingUrl } from '@/lib/recent-orders';

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

const inputClass =
  'w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';

const cardClass = 'rounded-xl border border-line bg-white shadow-sm';

const fieldClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';

// Bouton de retour
function BackLink() {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  );
}

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
  const [orders, setOrders] = useState<any[] | null>(null);
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

  useEffect(() => {
    setHasToken(!!getCustomerToken());
    setRecents(getRecentOrders());
  }, []);

  useEffect(() => {
    if (customer) {
      getMyOrders()
        .then(setOrders)
        .catch(() => setOrders([]));
    }
  }, [customer]);

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
    } catch (err: any) {
      setGeoError(err.message);
    } finally {
      setGeoLoading(false);
    }
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
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
      setTimeout(() => setSavedMsg(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || "Impossible d'enregistrer les modifications");
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
      <main className="min-h-screen bg-canvas p-8 text-gray-500">Chargement...</main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-xl">
          <BackLink />
          
          {loggedOut && (
            <div
              role="status"
              className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-4 text-success"
            >
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Vous êtes déconnecté</p>
                <p className="text-sm">À bientôt sur SportPro !</p>
              </div>
              <Link
                href="/"
                className="rounded-lg border border-success px-3 py-1.5 text-sm font-semibold transition hover:bg-white"
              >
                Retour à l'accueil
              </Link>
            </div>
          )}

          <h1 className="mb-6 text-3xl font-bold text-ink">Mon compte</h1>

          <section className={`${cardClass} mb-6 p-5 sm:p-6`}>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-ink">
              <PackageSearch className="h-5 w-5 text-action" />
              Suivre ma commande
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Pas besoin de compte : entrez le numéro de commande et le téléphone utilisé.
            </p>
            <form onSubmit={onTrack} className="space-y-3">
              <div className="relative">
                <Package className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  placeholder="Numéro de commande (CMD-...)"
                  value={numberInput}
                  onChange={(e) => setNumberInput(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="Téléphone"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-action px-6 py-3 font-semibold text-white transition hover:bg-action-dark"
              >
                Suivre ma commande
              </button>
            </form>

            {recents.length > 0 && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                  <Clock className="h-4 w-4 text-action" />
                  Sur cet appareil
                </p>
                <div className="space-y-2">
                  {recents.slice(0, 5).map((r) => (
                    <Link
                      key={r.orderNumber}
                      href={trackingUrl(r.orderNumber, r.phone)}
                      className="group flex items-center justify-between rounded-lg border border-line px-4 py-2.5 text-sm transition hover:border-action"
                    >
                      <span className="font-semibold text-ink">{r.orderNumber}</span>
                      <span className="flex items-center gap-2 text-gray-500">
                        {new Date(r.date).toLocaleDateString('fr-FR')}
                        <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:text-action" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={`${cardClass} p-5 sm:p-6`}>
            <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-ink">
              <User className="h-5 w-5 text-action" />
              Un compte, c'est plus pratique
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Retrouvez vos commandes, votre panier et vos favoris sur n'importe quel téléphone,
              même si vous changez d'appareil.
            </p>
            <Link
              href="/compte/connexion"
              className="inline-block rounded-lg bg-action px-6 py-3 font-semibold text-white transition hover:bg-action-dark"
            >
              Se connecter ou créer un compte
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const firstName = String(customer.name || '').split(' ')[0];
  const location = [customer.address, customer.region]
    .filter(Boolean)
    .join(', ');

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <BackLink />

        <h1 className="text-3xl font-bold text-ink">Bonjour {firstName}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Retrouvez vos informations et suivez vos commandes.
        </p>

        <div
          className={`mt-6 grid items-start gap-6 ${
            editing ? '' : 'md:grid-cols-[1fr_1.8fr]'
          }`}
        >
          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                <User className="h-7 w-7" />
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
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Informations mises à jour
              </div>
            )}

            {editing ? (
              <form onSubmit={saveProfile} className="mt-5 border-t border-line pt-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
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

                  <div>
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

                  <div>
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

                  <div>
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
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-action hover:text-action disabled:opacity-50"
                >
                  <LocateFixed className="h-4 w-4" />
                  {geoLoading ? 'Localisation en cours...' : 'Utiliser ma position'}
                </button>
                {geoInfo && (
                  <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
                    {geoInfo}
                  </p>
                )}
                {geoError && (
                  <p className="mt-2 rounded-lg bg-action-soft px-3 py-2 text-sm text-alert">
                    {geoError}
                  </p>
                )}
                {geoInfo && (
                  <p className="mt-1 text-xs text-gray-500">Adresse estimée avec © OpenStreetMap</p>
                )}

                <p className="mt-4 text-xs text-gray-500">
                  L'email sert à vous connecter, il ne peut pas être modifié ici.
                </p>

                {saveError && (
                  <p className="mt-3 rounded-lg bg-action-soft px-3 py-2 text-sm text-alert">
                    {saveError}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-dark disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
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
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <span className="break-all">{customer.email}</span>
                    </p>
                  )}
                  {customer.phone && (
                    <p className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      {customer.phone}
                    </p>
                  )}
                  {location && (
                    <p className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      {location}
                    </p>
                  )}
                </div>

                <button
                  onClick={startEdit}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier mes informations
                </button>

                <Link
                  href="/mon-compte/messages"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-action bg-action/5 px-4 py-2 text-sm font-semibold text-action transition hover:bg-action hover:text-white"
                >
                  <MessageSquare className="h-4 w-4" />
                  Mes messages
                </Link>
              </>
            )}

            <button
              onClick={() => {
                logout();
                setHasToken(false);
                setOrders(null);
                setLoggedOut(true);
                window.scrollTo({ top: 0 });
              }}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-action transition hover:text-action-dark"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </section>

          <section className={`${cardClass} p-5 sm:p-6`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
                <Package className="h-5 w-5 text-action" />
                Mes commandes
              </h2>
              {orders && (
                <span className="text-sm text-gray-500">
                  {orders.length} commande{orders.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {orders === null ? (
              <p className="py-6 text-gray-500">Chargement...</p>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Aucune commande pour le moment.</p>
                <Link
                  href="/boutique"
                  className="mt-4 inline-block rounded-lg bg-action px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-action-dark"
                >
                  Découvrir la boutique
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {orders.map((o) => {
                  const count = (o.items || []).reduce(
                    (s: number, i: any) => s + i.quantity,
                    0,
                  );
                  const ongoing = o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
                  return (
                    <Link
                      key={o.id}
                      href={trackingUrl(o.orderNumber, o.customerPhone)}
                      className="group flex flex-wrap items-center gap-3 py-3.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
                        <Package className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-semibold text-ink">{o.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(o.createdAt).toLocaleDateString('fr-FR')} · {count} article
                          {count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-3">
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
                        <span className="hidden items-center gap-1 text-sm font-semibold text-ink transition group-hover:text-action sm:inline-flex">
                          {ongoing ? 'Suivre' : 'Détails'}
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link
              href="/suivi"
              className="mt-4 inline-block text-sm font-medium text-ink underline transition hover:text-action"
            >
              Suivre une commande passée sans compte
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}