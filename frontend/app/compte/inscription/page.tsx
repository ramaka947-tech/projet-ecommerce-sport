'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LocateFixed,
  UserPlus,
} from 'lucide-react';
import { registerCustomer } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { CountrySelect, PhoneField } from '@/components/country-fields';
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  findCountry,
  formatFullPhone,
  validatePhone,
} from '@/lib/countries';
import { REGIONS_SENEGAL, getMyLocation } from '@/lib/geo';

// Champs à 16 px (taille par défaut) : iOS ne zoome pas au focus
const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-3 md:py-2.5 text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink';
const optionalHint = <span className="font-normal text-gray-500">(optionnel)</span>;
const cardClass = 'space-y-4 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6';

// Bouton de retour : page précédente du site, sinon la boutique
function BackLink() {
  const router = useRouter();
  const goBack = () => {
    if (typeof window === 'undefined') return;

    // On ne revient en arrière que si la page précédente est une page du site
    // (sinon un visiteur venu de WhatsApp ou Google quitterait la boutique).
    let cameFromSite = false;
    try {
      cameFromSite =
        !!document.referrer &&
        new URL(document.referrer).origin === window.location.origin;
    } catch {}

    if (cameFromSite && window.history.length > 1) {
      router.back();
    } else {
      router.push('/boutique');
    }
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition active:border-action active:text-action md:min-h-0 md:px-3 md:hover:border-action md:hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
    >
      <ArrowLeft className="size-4" />
      Retour
    </button>
  );
}

export default function RegisterPage() {
  const { login } = useCustomerAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneCountry: DEFAULT_COUNTRY,
    phoneNumber: '',
    country: DEFAULT_COUNTRY,
    region: '',
    quartier: '',
    address: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoInfo, setGeoInfo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  const isSenegal = form.country === 'SN';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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

      const newCountry =
        loc.countryCode && COUNTRIES.some((c) => c.code === loc.countryCode)
          ? loc.countryCode
          : form.country;

      setForm((f) => ({
        ...f,
        country: newCountry,
        phoneCountry: f.phoneNumber ? f.phoneCountry : newCountry,
        region: loc.region || (newCountry === f.country ? f.region : ''),
        quartier: loc.quartier || f.quartier,
        address: f.address || loc.road,
      }));

      setGeoInfo(
        loc.region && loc.quartier
          ? `Position trouvée : ${loc.quartier}, ${loc.region}. Vérifiez et ajoutez un repère précis.${accuracyNote}`
          : `Position trouvée. Région ou quartier non détectés : complétez les champs manquants.${accuracyNote}`,
      );
    } catch (e: any) {
      setGeoError(e.message);
    } finally {
      setGeoLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (name.length < 2) {
      setError('Entrez votre nom complet.');
      return;
    }
    const phoneError = validatePhone(form.phoneCountry, form.phoneNumber);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();
      const res = await registerCustomer({
        name,
        email,
        password: form.password,
        phone: formatFullPhone(form.phoneCountry, form.phoneNumber),
        country: findCountry(form.country).name,
        region: form.region.trim() || undefined,
        district: form.quartier.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      login(res.accessToken, res.customer);
      setDoneEmail(email);
    } catch (err: any) {
      setError(err.message || "L'inscription a échoué.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Écran de réussite
  // ------------------------------------------------------------------
  if (doneEmail) {
    return (
      <main className="bg-canvas px-4 py-6 sm:px-8 sm:py-10 md:min-h-screen">
        <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-5 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">Compte créé</h1>
          <p className="mt-3 text-sm text-gray-600">
            Bienvenue ! Un email de bienvenue est envoyé à{' '}
            <strong className="break-all text-ink">{doneEmail}</strong>. Pensez à regarder dans
            vos courriers indésirables s'il n'arrive pas.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/boutique"
              className="flex min-h-12 touch-manipulation items-center justify-center rounded-lg bg-action px-6 py-3 font-semibold text-white transition active:bg-action-dark md:hover:bg-action-dark"
            >
              Continuer mes achats
            </Link>
            <Link
              href="/mon-compte"
              className="flex min-h-12 touch-manipulation items-center justify-center rounded-lg border border-ink px-6 py-3 font-semibold text-ink transition active:bg-ink active:text-white md:hover:bg-ink md:hover:text-white"
            >
              Mon compte
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Formulaire
  // ------------------------------------------------------------------
  return (
    <main className="bg-canvas px-4 py-4 sm:px-8 sm:py-10 md:min-h-screen">
      <div className="mx-auto max-w-xl">
        <BackLink />

        <div className="mt-5 flex items-center gap-3 sm:mt-6 sm:gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-action text-white sm:size-14">
            <UserPlus className="size-6 sm:size-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Créer un compte</h1>
            <p className="mt-1 text-sm text-gray-600">
              Retrouvez vos commandes sur n'importe quel appareil.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-4 sm:mt-6 md:space-y-6">
          {/* Informations personnelles */}
          <section className={cardClass}>
            <h2 className="text-lg font-bold text-ink">Vos informations</h2>

            <div>
              <label htmlFor="name" className={labelClass}>
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                autoCapitalize="words"
                value={form.name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={form.email}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className={labelClass}>
                Téléphone
              </label>
              <PhoneField
                id="phoneNumber"
                required
                country={form.phoneCountry}
                number={form.phoneNumber}
                onCountryChange={(c) => setForm((f) => ({ ...f, phoneCountry: c }))}
                onNumberChange={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
                inputClass={inputClass}
              />
            </div>
          </section>

          {/* Adresse */}
          <section className={cardClass}>
            <h2 className="text-lg font-bold text-ink">Votre adresse</h2>

            <div>
              <label htmlFor="country" className={labelClass}>
                Pays {optionalHint}
              </label>
              <CountrySelect id="country" value={form.country} onChange={handleCountryChange} />
            </div>

            <div>
              <label htmlFor="region" className={labelClass}>
                {isSenegal ? 'Région' : 'Région / ville'} {optionalHint}
              </label>
              {isSenegal ? (
                <select
                  id="region"
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Choisir une région</option>
                  {REGIONS_SENEGAL.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="region"
                  name="region"
                  autoComplete="address-level1"
                  value={form.region}
                  onChange={handleChange}
                  className={inputClass}
                />
              )}
            </div>

            <div>
              <label htmlFor="quartier" className={labelClass}>
                Quartier {optionalHint}
              </label>
              <input
                id="quartier"
                name="quartier"
                autoComplete="address-level2"
                placeholder="Ex : Parcelles Assainies, Unité 15"
                value={form.quartier}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="address" className={labelClass}>
                Adresse précise / repère {optionalHint}
              </label>
              <input
                id="address"
                name="address"
                autoComplete="street-address"
                placeholder="Ex : villa n°12, en face de la pharmacie"
                value={form.address}
                onChange={handleChange}
                className={inputClass}
              />

              <button
                type="button"
                onClick={locate}
                disabled={geoLoading}
                className="mt-3 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition active:border-action active:text-action sm:w-auto md:min-h-0 md:hover:border-action md:hover:text-action disabled:opacity-50"
              >
                <LocateFixed className="size-4" />
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
            </div>
          </section>

          {/* Mot de passe */}
          <section className={cardClass}>
            <h2 className="text-lg font-bold text-ink">Sécurité</h2>

            <div>
              <label htmlFor="password" className={labelClass}>
                Mot de passe{' '}
                <span className="font-normal text-gray-500">(6 caractères minimum)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-12`}
                />
                {/* Zone tactile de 48 px sur toute la hauteur du champ */}
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 touch-manipulation items-center justify-center rounded-r-lg text-gray-500 transition active:text-ink md:hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-action-soft px-3 py-2.5 text-sm text-alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-words">{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full touch-manipulation rounded-lg bg-action px-6 py-3 font-semibold text-white transition active:bg-action-dark md:hover:bg-action-dark disabled:opacity-50"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </section>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link
              href="/compte/connexion"
              className="inline-flex min-h-11 touch-manipulation items-center font-semibold text-action transition active:text-action-dark md:hover:text-action-dark md:hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}