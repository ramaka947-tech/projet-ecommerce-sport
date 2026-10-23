'use client';
import { useEffect, useState } from 'react';
import { getAdmins, createAdmin, deleteAdmin } from '@/lib/api';
import { UserPlus, Trash2, Loader2, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';

export default function AdminSettingsPage() {
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
  const passwordValid = rules.every(r => r.ok);

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
    setSaving(true); setMsg(null);
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
    if (!confirm('Supprimer cet administrateur ?')) return;
    try {
      await deleteAdmin(id);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const inputCls = "w-full rounded-lg border border-line bg-canvas/50 px-3 py-2.5 text-sm text-ink focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 transition-colors placeholder:text-ink/40";

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-action text-white flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Gestion des accès</h1>
            <p className="text-sm text-ink/60 mt-0.5">Gérez les personnes ayant accès à l'administration.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_1.5fr] gap-6 items-start">

          {/* Formulaire d'ajout */}
          <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-4 border-b border-line pb-3 flex items-center gap-2">
              <UserPlus size={18} className="text-action" /> Nouveau compte
            </h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-ink">Nom complet</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex : Rama KA"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-ink">Adresse email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Ex : rama@sportpro.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-ink">Mot de passe</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-action transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                                {pwd.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {rules.map(r => (
                      <li key={r.label} className={`text-xs ${r.ok ? 'text-success' : 'text-ink/50'}`}>
                        {r.ok ? '✓' : '•'} {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {msg && (
                <div className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${msg.ok ? 'bg-success-soft border-success/20 text-success' : 'bg-action-soft border-action/20 text-action'}`}>
                  {msg.ok && <CheckCircle2 size={16} />} {msg.text}
                </div>
              )}

              <button type="submit" disabled={saving || !passwordValid} className="w-full bg-ink text-white font-semibold py-2.5 rounded-lg hover:bg-ink/90 transition disabled:opacity-50">
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </form>
          </section>

          {/* Liste des admins */}
          <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-4 border-b border-line pb-3">Comptes administrateurs</h2>

            {loading ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-action" /></div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 border border-line rounded-xl bg-canvas/30">
                    <div>
                      <p className="font-bold text-ink text-sm">{admin.name || 'Sans nom'}</p>
                      <p className="text-xs text-ink/60">{admin.email}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="p-2 text-action hover:bg-action-soft rounded-lg transition"
                      title="Supprimer cet accès"
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