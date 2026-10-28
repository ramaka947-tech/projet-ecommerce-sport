'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { loginCustomer } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';

// 16 px sur mobile pour éviter le zoom automatique d'iOS
const inputClass =
  'w-full min-h-12 rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-base md:text-sm text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';

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

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginCustomer(email.trim(), password);
      login(data.accessToken, data.customer);
      router.push('/mon-compte');
    } catch (err: any) {
      setError(err.message || 'Erreur');
      setLoading(false);
    }
  };

  return (
    <main className="bg-canvas px-4 py-4 sm:px-8 sm:py-10 md:min-h-screen">
      <div className="mx-auto max-w-md">
        <BackLink />

        <div className="mt-5 flex items-center gap-3 sm:mt-6 sm:gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-action text-white sm:size-14">
            <LogIn className="size-6 sm:size-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Connexion</h1>
            <p className="mt-1 text-sm text-gray-600">
              Retrouvez vos commandes et vos informations.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-4 rounded-xl border border-line bg-white p-4 shadow-sm sm:mt-6 sm:space-y-5 sm:p-6"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 sm:mt-5">
          Pas de compte ?{' '}
          <Link
            href="/compte/inscription"
            className="inline-flex min-h-11 touch-manipulation items-center font-semibold text-action transition active:text-action-dark md:hover:text-action-dark md:hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}