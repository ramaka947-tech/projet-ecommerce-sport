'use client';

import { useCart } from '@/lib/cart-context';
import { createOrder, getSettings, getPaymentMethods } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  Home,
  Lock,
  MapPin,
  MessageSquare,
  Pencil,
  ShoppingCart,
  User,
  Wallet,
} from 'lucide-react';
import { useCurrency } from '@/lib/currency';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { CountrySelect, PhoneField } from '@/components/country-fields';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  countryCodeFrom,
  findCountry,
  formatFullPhone,
  splitPhone,
  validatePhone,
} from '@/lib/countries';
import { REGIONS_SENEGAL, getMyLocation, matchRegion } from '@/lib/geo';
import BackButton from '../panier/back-button';

// Retrouve l'image d'un article du panier, quel que soit le nom du champ.
// Si ton panier utilise un autre nom, ajoute-le ici.
function getItemImage(item: any): string {
  const first = Array.isArray(item.images) ? item.images[0] : undefined;
  const candidate = item.image ?? item.imageUrl ?? item.thumbnail ?? first;
  if (!candidate) return '';
  return typeof candidate === 'string' ? candidate : candidate.url ?? '';
}

const inputClass =
  'w-full border border-line rounded-xl px-4 py-3 text-sm bg-white text-ink focus:outline-none focus:border-action';
// Même style, avec la place pour une icône à gauche
const iconInputClass = `${inputClass} pl-11`;

// ---------------------------------------------------------------------------
// Petits composants de présentation
// ---------------------------------------------------------------------------

function Field({
  label,
  htmlFor,
  required,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
        {label} {required && <span className="text-action">*</span>}
      </label>
      {children}
    </div>
  );
}

function WithIcon({
  icon: Icon,
  top = false,
  children,
}: {
  icon: any;
  top?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon
        size={18}
        className={`absolute left-4 text-ink/40 pointer-events-none ${
          top ? 'top-3.5' : 'top-1/2 -translate-y-1/2'
        }`}
      />
      {children}
    </div>
  );
}

function SectionTitle({ n, icon: Icon, title }: { n: number; icon: any; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-action text-white text-sm font-bold flex items-center justify-center">
        {n}
      </span>
      <Icon size={20} className="text-ink/70" />
      <h2 className="font-bold text-ink">{title}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { customer } = useCustomerAuth();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [pmLoaded, setPmLoaded] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    phoneCountry: DEFAULT_COUNTRY, // pays de l'indicatif
    phoneNumber: '',
    country: DEFAULT_COUNTRY,
    region: '',
    quartier: '',
    address: '',
    comment: '',
    paymentMethod: '',
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoInfo, setGeoInfo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prefillDone = useRef(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setDeliveryFee(Number(s.delivery_fee) || 0))
      .catch(() => { });
  }, []);

  useEffect(() => {
    getPaymentMethods()
      .then((list: any[]) => {
        setPaymentMethods(list);
        if (list.length > 0) {
          setForm((f) => ({ ...f, paymentMethod: f.paymentMethod || list[0].name }));
        }
      })
      .catch(() => { })
      .finally(() => setPmLoaded(true));
  }, []);

  // Client connecté : on préremplit avec les informations de son compte (modifiables)
  useEffect(() => {
    if (!customer || prefillDone.current) return;
    prefillDone.current = true;

    const phone = splitPhone(customer.phone);
    const country = countryCodeFrom(customer.country) ?? DEFAULT_COUNTRY;
    const region =
      country === 'SN' ? matchRegion(customer.region) : String(customer.region || '');

    setForm((f) => ({
      ...f,
      customerName: f.customerName || customer.name || '',
      phoneCountry: phone?.country ?? country,
      phoneNumber: f.phoneNumber || phone?.number || '',
      country,
      region: f.region || region,
      quartier: f.quartier || customer.district || '',
      address: f.address || customer.address || '',
    }));
    setPrefilled(true);
  }, [customer]);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-canvas text-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <BackButton />
          <h1 className="mt-5 text-3xl sm:text-4xl font-bold">Commande</h1>

          <div className="mt-8 bg-white rounded-2xl border border-line p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-canvas text-ink/40 flex items-center justify-center">
              <ShoppingCart size={30} />
            </div>
            <p className="mt-5 font-semibold text-xl">Votre panier est vide</p>
            <Link
              href="/boutique"
              className="mt-7 inline-block bg-action hover:bg-action-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Voir la boutique
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Changer de pays : la région repart à zéro, et l'indicatif suit si le numéro est vide
  const handleCountryChange = (code: string) => {
    setForm((f) => ({
      ...f,
      country: code,
      region: '',
      phoneCountry: f.phoneNumber ? f.phoneCountry : code,
    }));
  };

  const locateMe = async () => {
    setGeoLoading(true);
    setGeoError('');
    setGeoInfo('');
    try {
      const loc = await getMyLocation();
      setCoords(loc.coords);
      // Sur ordinateur, la position vient souvent du Wi-Fi/IP : elle peut être décalée de plusieurs centaines de mètres
      const accuracyNote =
        loc.accuracy > 300
          ? ` Précision faible (environ ${Math.round(loc.accuracy)} m) : la position peut être décalée. Sur téléphone, c'est plus précis.`
          : '';

      if (!loc.resolved) {
        setGeoInfo(
          "Position enregistrée, mais l'adresse n'a pas pu être déduite. Remplissez les champs à la main.",
        );
        return;
      }

      const newCountry =
        loc.countryCode && COUNTRIES.some((c) => c.code === loc.countryCode)
          ? loc.countryCode
          : form.country;

      setForm((f) => ({
        ...f,
        country: newCountry,
        phoneCountry: f.phoneNumber ? f.phoneCountry : newCountry,
        // on ne remplace une valeur existante que si on en a trouvé une nouvelle
        region: loc.region || (newCountry === f.country ? f.region : ''),
        quartier: loc.quartier || f.quartier,
        address: f.address || loc.road,
      }));

      setGeoInfo(
        loc.region && loc.quartier
          ? `Position trouvée : ${loc.quartier}, ${loc.region}. Vérifiez et ajoutez un repère précis.${accuracyNote}`
          : `Position enregistrée. Région ou quartier non détectés : complétez les champs manquants.${accuracyNote}`,
      );
    } catch (e: any) {
      setGeoError(e.message);
    } finally {
      setGeoLoading(false);
    }
  };

  const isSenegal = form.country === 'SN';
  const country = findCountry(form.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.paymentMethod) {
      setError('Aucun mode de paiement disponible pour le moment.');
      return;
    }

    // Validation du téléphone
    const phoneError = validatePhone(form.phoneCountry, form.phoneNumber);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);

    // On réutilise les champs existants du back, sans rien modifier côté serveur :
    // - city             = région (+ pays si hors Sénégal)
    // - customerAddress  = quartier + adresse précise
    // - comment          = commentaire + précisions + lien Google Maps si la position a été partagée
    const city = isSenegal ? form.region : `${form.region}, ${country.name}`;
    const customerAddress = `${form.quartier.trim()}, ${form.address.trim()}`;
    const mapLink = coords
      ? `Position GPS : https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : '';
    const notes = items
      .filter((i) => i.note)
      .map(
        (i) =>
          `Précision (${i.name}${i.size ? ' ' + i.size : ''}${i.color ? ' ' + i.color : ''}) : ${i.note}`,
      )
      .join('\n');
    const comment = [form.comment.trim(), notes, mapLink].filter(Boolean).join('\n');

    try {
      const order = await createOrder({
        customerName: form.customerName.trim(),
        customerPhone: formatFullPhone(form.phoneCountry, form.phoneNumber),
        customerAddress,
        city,
        comment,
        paymentMethod: form.paymentMethod,
        deliveryFee,
        customerId: customer?.id,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
        })),
      });
      clearCart();
      router.push(`/confirmation/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const total = subtotal + deliveryFee;
  const selectedMethod = paymentMethods.find((m) => m.name === form.paymentMethod);
  const noPayment = pmLoaded && paymentMethods.length === 0;
  const count = items.length;
  const submitDisabled = loading || !form.paymentMethod;
  const submitClass =
    'w-full flex items-center justify-center gap-2.5 bg-action hover:bg-action-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <BackButton />

        <h1 className="mt-5 text-3xl sm:text-4xl font-bold">Finaliser la commande</h1>
        <p className="mt-1 text-ink/60">
          Remplissez vos informations ci-dessous pour compléter votre commande.
        </p>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
          {/* ---------------- Formulaire ---------------- */}
          <form
            id="checkout-form"
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-line p-6 sm:p-8 space-y-8"
          >
            {/* 1. Informations personnelles */}
            <section className="space-y-5">
              <SectionTitle n={1} icon={User} title="Informations personnelles" />

              {prefilled && (
                <p className="rounded-xl bg-canvas px-4 py-2.5 text-sm text-ink/60">
                  Informations préremplies depuis votre compte. Modifiez-les si besoin.
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
                {/* Nom */}
                <Field label="Nom complet" htmlFor="customerName" required>
                  <WithIcon icon={User}>
                    <input
                      id="customerName"
                      name="customerName"
                      required
                      autoComplete="name"
                      value={form.customerName}
                      onChange={handleChange}
                      className={iconInputClass}
                    />
                  </WithIcon>
                </Field>

                {/* Téléphone */}
                <Field label="Téléphone" htmlFor="phoneNumber" required>
                  <PhoneField
                    id="phoneNumber"
                    required
                    country={form.phoneCountry}
                    number={form.phoneNumber}
                    onCountryChange={(c) => setForm((f) => ({ ...f, phoneCountry: c }))}
                    onNumberChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
                    inputClass={inputClass}
                  />
                </Field>

                {/* Pays */}
                <Field label="Pays" htmlFor="country" required>
                  <CountrySelect id="country" value={form.country} onChange={handleCountryChange} />
                </Field>

                {/* Région (liste si Sénégal, texte libre sinon) */}
                <Field
                  label={isSenegal ? 'Région' : 'Région / ville'}
                  htmlFor="region"
                  required
                >
                  <WithIcon icon={MapPin}>
                    {isSenegal ? (
                      <select
                        id="region"
                        name="region"
                        required
                        value={form.region}
                        onChange={handleChange}
                        className={iconInputClass}
                      >
                        <option value="" className="text-black">
                          Choisir une région
                        </option>
                        {REGIONS_SENEGAL.map((r) => (
                          <option key={r} value={r} className="text-black">
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="region"
                        name="region"
                        required
                        autoComplete="address-level1"
                        value={form.region}
                        onChange={handleChange}
                        className={iconInputClass}
                      />
                    )}
                  </WithIcon>
                </Field>

                {/* Quartier */}
                <Field label="Quartier" htmlFor="quartier" required>
                  <WithIcon icon={Home}>
                    <input
                      id="quartier"
                      name="quartier"
                      required
                      placeholder="Ex : Parcelles Assainies, Unité 15"
                      value={form.quartier}
                      onChange={handleChange}
                      className={iconInputClass}
                    />
                  </WithIcon>
                </Field>

                {/* Adresse précise */}
                <Field label="Adresse précise / repère" htmlFor="address" required>
                  <WithIcon icon={MapPin}>
                    <input
                      id="address"
                      name="address"
                      required
                      autoComplete="street-address"
                      placeholder="Ex : villa n°12, en face de la pharmacie"
                      value={form.address}
                      onChange={handleChange}
                      className={iconInputClass}
                    />
                  </WithIcon>
                </Field>
              </div>

              {/* Position */}
              <div>
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={geoLoading}
                  className="inline-flex items-center gap-2 text-sm font-medium border border-line rounded-xl px-4 py-2.5 hover:border-action hover:text-action transition disabled:opacity-50"
                >
                  <MapPin size={16} />
                  {geoLoading
                    ? 'Localisation en cours...'
                    : coords
                      ? 'Mettre à jour ma position'
                      : 'Utiliser ma position'}
                </button>

                {coords && (
                  <p className="mt-2 text-sm text-success">
                    {geoInfo || 'Position enregistrée.'} Le livreur la verra avec votre commande.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setCoords(null);
                        setGeoInfo('');
                      }}
                      className="underline font-medium"
                    >
                      Retirer
                    </button>
                    <span className="block text-xs text-ink/50 mt-1">
                      Adresse estimée avec © OpenStreetMap
                    </span>
                  </p>
                )}
                {geoError && <p className="mt-2 text-sm text-alert">{geoError}</p>}
              </div>

              {/* Commentaire */}
              <Field label="Commentaire (optionnel)" htmlFor="comment">
                <WithIcon icon={MessageSquare} top>
                  <textarea
                    id="comment"
                    name="comment"
                    value={form.comment}
                    onChange={handleChange}
                    placeholder="Instructions particulières (optionnel)"
                    className={`${iconInputClass} resize-none`}
                    rows={3}
                  />
                </WithIcon>
              </Field>
            </section>

            {/* 2. Mode de paiement */}
            <section className="space-y-4 border-t border-line pt-7">
              <SectionTitle n={2} icon={CreditCard} title="Mode de paiement" />

              {noPayment ? (
                <p className="text-sm text-alert">
                  Aucun mode de paiement n'est disponible pour le moment.
                </p>
              ) : (
                <WithIcon icon={Wallet}>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    aria-label="Mode de paiement"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className={iconInputClass}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.name} className="text-black">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </WithIcon>
              )}

              {selectedMethod?.instructions && (
                <div className="rounded-xl border border-action/20 bg-action-soft p-4 text-sm text-ink">
                  <p className="font-semibold mb-1">Comment payer</p>
                  <p className="whitespace-pre-line text-ink/80">{selectedMethod.instructions}</p>
                </div>
              )}
            </section>

            {error && <p className="text-alert text-sm">{error}</p>}

            {/* Sur mobile : le bouton est ici ; sur ordinateur, il est dans le récapitulatif */}
            <button type="submit" disabled={submitDisabled} className={`${submitClass} lg:hidden`}>
              <Lock size={18} />
              {loading ? 'Envoi en cours...' : 'Confirmer la commande'}
            </button>
          </form>

          {/* ---------------- Récapitulatif ---------------- */}
          <aside className="bg-white rounded-2xl border border-line p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Récapitulatif de la commande</h2>
              <Link
                href="/panier"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-action shrink-0"
              >
                <Pencil size={14} />
                Modifier le panier
              </Link>
            </div>

            {/* Liste des articles : défile s'il y en a beaucoup */}
            <div className="mt-5 max-h-[26rem] overflow-y-auto -mr-2 pr-2 divide-y divide-line">
              {items.map((item) => {
                const img = getItemImage(item);
                const sizeLabel =
                  item.size && /^\d/.test(String(item.size)) ? 'Pointure' : 'Taille';
                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    {/* Image (proportions respectées) */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                      {img ? (
                        <img
                          src={img}
                          alt={item.name}
                          loading="lazy"
                          className="block max-w-full max-h-full w-auto h-auto rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-canvas" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <p className="font-semibold text-ink line-clamp-1">{item.name}</p>
                        {(item.size || item.color) && (
                          <p className="mt-0.5 text-sm text-ink/55">
                            {item.color && `Couleur : ${item.color}`}
                            {item.size && item.color && ' · '}
                            {item.size && `${sizeLabel} : ${item.size}`}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-ink/60">
                        Quantité : <span className="font-semibold text-ink">{item.quantity}</span>
                      </p>
                    </div>

                    <p className="font-bold text-ink shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 border-t border-line pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span>
                  Sous-total ({count} {count > 1 ? 'articles' : 'article'})
                </span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                {deliveryFee === 0 ? (
                  <span className="font-medium text-success">Gratuite</span>
                ) : (
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4 flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-action">{formatPrice(total)}</span>
            </div>

            {/* Ordinateur : le bouton de validation du formulaire */}
            <button
              type="submit"
              form="checkout-form"
              disabled={submitDisabled}
              className={`${submitClass} mt-5 hidden lg:flex`}
            >
              <Lock size={18} />
              {loading ? 'Envoi en cours...' : 'Confirmer la commande'}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}