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

const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink';
const optionalHint = <span className="font-normal text-gray-400">(optionnel)</span>;

// Bouton de retour : page précédente, sinon la boutique
function BackLink() {
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
      <main className="min-h-screen bg-canvas px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-md rounded-xl border border-line bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="h-9 w-9" />
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
              className="rounded-lg bg-action px-6 py-3 font-semibold text-white transition hover:bg-action-dark"
            >
              Continuer mes achats
            </Link>
            <Link
              href="/mon-compte"
              className="rounded-lg border border-ink px-6 py-3 font-semibold text-ink transition hover:bg-ink hover:text-white"
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
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-xl">
        <BackLink />

        <div className="mt-6 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-action text-white">
            <UserPlus className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Créer un compte</h1>
            <p className="mt-1 text-sm text-gray-500">
              Retrouvez vos commandes sur n'importe quel appareil.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          {/* Informations personnelles */}
          <section className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
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
                required
                autoComplete="email"
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
          <section className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
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
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-action hover:text-action disabled:opacity-50"
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
            </div>
          </section>

          {/* Mot de passe */}
          <section className="space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-ink">Sécurité</h2>

            <div>
              <label htmlFor="password" className={labelClass}>
                Mot de passe{' '}
                <span className="font-normal text-gray-400">(6 caractères minimum)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </section>

          <p className="text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <Link
              href="/compte/connexion"
              className="font-semibold text-action transition hover:text-action-dark hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}