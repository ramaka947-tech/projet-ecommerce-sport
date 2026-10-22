'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import { loginCustomer } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';

const inputClass =
  'w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-ink placeholder:text-gray-400 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20';

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
      const data = await loginCustomer(email, password);
      login(data.accessToken, data.customer);
      router.push('/mon-compte');
    } catch (err: any) {
      setError(err.message || 'Erreur');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-md">
        <BackLink />

        <div className="mt-6 flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-action text-white">
            <LogIn className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">Connexion</h1>
            <p className="mt-1 text-sm text-gray-500">
              Retrouvez vos commandes et vos informations.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
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
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Pas de compte ?{' '}
          <Link
            href="/compte/inscription"
            className="font-semibold text-action transition hover:text-action-dark hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}