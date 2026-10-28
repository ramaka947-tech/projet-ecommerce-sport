'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { login } from '@/lib/api';
import { saveToken } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
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
      const result = await login(email, password);
      saveToken(result.accessToken);

      // Sauvegarde du nom ET de l'email pour l'affichage
      try {
        const displayName = result.admin?.name || result.admin?.email?.split('@')[0] || 'Admin';
        localStorage.setItem('admin_name', displayName);
        if (result.admin?.email) {
          localStorage.setItem('admin_email', result.admin.email);
        }
      } catch {
        /* stockage indisponible : l'affichage du nom retombera sur "Admin" */
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(
        err?.message === 'Invalid credentials' || err?.message === 'Login failed'
          ? 'Email ou mot de passe incorrect.'
          : err?.message || 'Une erreur est survenue. Réessayez.',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'min-h-12 w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-base text-ink placeholder:text-ink/40 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 transition-colors md:min-h-0 md:text-sm';

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white px-5 py-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:px-10 sm:py-10">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <img src="/logo.png" alt="" className="size-11 shrink-0 rounded-full object-cover" />
          <span className="flex flex-col text-2xl font-extrabold leading-none tracking-tight text-ink sm:text-3xl">
            <span>AD Sport</span>
            <span className="mt-1 text-action">Solutions</span>
          </span>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Connexion administrateur</h1>
          <p className="mt-2 text-sm text-ink/60">Accédez à votre espace administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
              <input
                id="email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={inputCls}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink">
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className={`${inputCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-ink/50 transition-colors hover:text-action"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-action/20 bg-action-soft px-3 py-2 text-sm text-action"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-black py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Connexion...
              </>
            ) : (
              <>
                Se connecter <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Séparateur */}
        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 border-t border-line" />
          <span className="text-xs text-ink/40">AD Sport Solutions</span>
          <div className="flex-1 border-t border-line" />
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ink/60">
          <ShieldCheck size={14} className="text-action" />
          Accès réservé aux administrateurs
        </p>
      </div>
    </main>
  );
}