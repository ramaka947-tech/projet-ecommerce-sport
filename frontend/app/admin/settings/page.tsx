'use client';
import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, deleteAdmin } from '@/lib/api';
import { UserPlus, Trash2, Loader2, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { useDialog } from '@/components/dialog-provider';

export default function AdminSettingsPage() {
  const { confirmDialog, alertDialog } = useDialog();

  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // État pour afficher/masquer le mot de passe
  const [showPassword, setShowPassword] = useState(false);

  // Formulaire d'ajout
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const pwd = form.password;
  const rules = [
    { ok: pwd.length >= 8, label: '8 caractères minimum' },
    { ok: /[a-z]/.test(pwd), label: 'Une lettre minuscule' },
    { ok: /[A-Z]/.test(pwd), label: 'Une lettre majuscule' },
    { ok: /[0-9]/.test(pwd), label: 'Un chiffre' },
    { ok: /[^A-Za-z0-9]/.test(pwd), label: 'Un caractère spécial (! @ # $ %...)' },
  ];
  const passwordValid = rules.every((r) => r.ok);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch {
      setMsg({ ok: false, text: 'Impossible de charger les comptes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      setMsg({ ok: false, text: 'Le mot de passe ne respecte pas toutes les règles.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await createAdmin(form);

      // Vider le formulaire
      setForm({ name: '', email: '', password: '' });
      setShowPassword(false);

      if (res?.emailSent === false) {
        setMsg({ ok: false, text: "Compte créé, mais l'email n'a pas pu être envoyé." });
      } else {
        setMsg({ ok: true, text: 'Compte créé et email envoyé avec succès.' });
      }

      await load();
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Supprimer cet administrateur ?',
      message: "Cette personne perdra immédiatement son accès à l'administration.",
      confirmText: 'Supprimer',
    });
    if (!ok) return;
    try {
      await deleteAdmin(id);
      await load();
    } catch (err: any) {
      await alertDialog(err.message, 'Suppression impossible');
    }
  };

  const inputCls =
    'min-h-11 w-full rounded-lg border border-line bg-canvas/50 px-3 py-2.5 text-base text-ink transition-colors placeholder:text-ink/40 focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 md:min-h-0 md:text-sm';
  const labelCls = 'mb-1.5 block text-sm font-semibold text-ink';

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-action text-white">
            <Shield size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink md:text-2xl">Gestion des accès</h1>
            <p className="mt-0.5 text-sm text-ink/60">
              Gérez les personnes ayant accès à l'administration.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[1fr_1.5fr] md:gap-6">
          {/* Formulaire d'ajout */}
          <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <h2 className="mb-4 flex items-center gap-2 border-b border-line pb-3 text-lg font-bold text-ink">
              <UserPlus size={18} className="text-action" /> Nouveau compte
            </h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label htmlFor="adm_name" className={labelCls}>Nom complet</label>
                <input
                  id="adm_name"
                  required
                  autoComplete="off"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex : Rama KA"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="adm_email" className={labelCls}>Adresse email</label>
                <input
                  id="adm_email"
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Ex : rama@adsportsolution.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="adm_password" className={labelCls}>Mot de passe</label>
                <div className="relative">
                  <input
                    id="adm_password"
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className={`${inputCls} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-ink/40 transition-colors hover:text-action md:size-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {pwd.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rules.map((r) => (
                      <li key={r.label} className={`text-xs ${r.ok ? 'text-success' : 'text-ink/50'}`}>
                        {r.ok ? '✓' : '•'} {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {msg && (
                <div
                  role="status"
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                    msg.ok
                      ? 'border-success/20 bg-success-soft text-success'
                      : 'border-action/20 bg-action-soft text-action'
                  }`}
                >
                  {msg.ok && <CheckCircle2 size={16} className="shrink-0" />} {msg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !passwordValid}
                className="min-h-12 w-full rounded-lg bg-ink py-2.5 font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50 md:min-h-0"
              >
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </section>

          {/* Liste des admins */}
          <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <h2 className="mb-4 border-b border-line pb-3 text-lg font-bold text-ink">
              Comptes administrateurs
            </h2>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-action" />
              </div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas/30 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{admin.name || 'Sans nom'}</p>
                      <p className="truncate text-xs text-ink/60">{admin.email}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      aria-label={`Supprimer l'accès de ${admin.name || admin.email}`}
                      title="Supprimer cet accès"
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-action transition hover:bg-action-soft md:size-9"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminGuard>
  );
}