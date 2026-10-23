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
      const displayName = result.admin?.name || result.admin?.email?.split('@')[0] || 'Admin';
      localStorage.setItem('admin_name', displayName);
      if (result.admin?.email) {
        localStorage.setItem('admin_email', result.admin.email);
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
    'w-full rounded-lg border border-line bg-white py-3 pl-10 pr-3 text-sm text-ink placeholder:text-ink/40 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 transition-colors';

  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-line px-8 py-10 sm:px-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo.png" alt="" className="h-11 w-auto" />
          <span className="text-3xl font-extrabold tracking-tight text-ink">
            Sport<span className="text-action">Pro</span>
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink">Connexion administrateur</h1>
          <p className="text-sm text-ink/60 mt-2">Accédez à votre espace administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-ink mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/50" />
              <input
                id="email"
                type="email"
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
            <label htmlFor="password" className="block text-sm font-semibold text-ink mb-1.5">
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
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/50 hover:text-action transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-action bg-action-soft border border-action/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white font-semibold py-3.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
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
        <div className="flex items-center gap-4 mt-8">
          <div className="flex-1 border-t border-line" />
          <span className="text-xs text-ink/40">SportPro</span>
          <div className="flex-1 border-t border-line" />
        </div>

        <p className="flex items-center justify-center gap-2 text-xs text-ink/60 mt-5">
          <ShieldCheck size={14} className="text-action" />
          Accès réservé aux administrateurs
        </p>
      </div>
    </main>
  );
}