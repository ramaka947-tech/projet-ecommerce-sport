'use client';
import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getSettings, updateSettings } from '@/lib/api';
import { Settings, Store, Truck, Coins, Loader2, Pencil, CheckCircle2, Type } from 'lucide-react';

export default function ConfigurationPage() {
  const [form, setForm] = useState({
    shop_name: '',
    tagline: '',
    delivery_fee: '',
    currency: 'FCFA',
    promo_banner_enabled: 'true',
    promo_banner_title: '',
    promo_banner_subtitle: '',
    promo_banner_button_label: '',
    promo_banner_link: '',
    hero_title: '',
    hero_subtitle: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getSettings()
      .then((s) =>
        setForm((f) => ({
          ...f,
          ...Object.fromEntries(
            Object.keys(f).map((k) => [k, s[k] ?? f[k as keyof typeof f]]),
          ),
        })),
      )
      .catch(() => setMsg({ ok: false, text: 'Impossible de charger les réglages.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!form.shop_name.trim()) {
      setMsg({ ok: false, text: 'Le nom de la boutique est obligatoire.' });
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        ...form,
        shop_name: form.shop_name.trim(),
        tagline: form.tagline.trim(),
      });
      setMsg({ ok: true, text: 'Configuration enregistrée avec succès.' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || 'Erreur.' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink transition-colors focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 md:min-h-0 md:text-sm';
  const labelCls = 'mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink';

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-action" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl">
        {/* En-tête */}
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-action text-white">
            <Settings size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink md:text-2xl">Configuration</h1>
            <p className="mt-0.5 text-sm text-ink/60">Gérez les paramètres généraux de votre boutique.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Carte Identité */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-action/10 text-action">
                <Type size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">Identité de la boutique</h2>
                <p className="text-xs text-ink/50">Nom et slogan affichés sur le site et dans les e-mails.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="shop_name" className={labelCls}>Nom de la boutique</label>
                <input
                  id="shop_name"
                  name="shop_name"
                  value={form.shop_name}
                  onChange={handleChange}
                  placeholder="AD Sport Solutions"
                  autoComplete="off"
                  className={inputCls}
                />
                <p className="mt-1.5 text-xs text-ink/50">
                  Le dernier mot s'affiche en rouge sur mobile.
                </p>
              </div>
              <div>
                <label htmlFor="tagline" className={labelCls}>Slogan</label>
                <input
                  id="tagline"
                  name="tagline"
                  value={form.tagline}
                  onChange={handleChange}
                  autoComplete="off"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* Carte Boutique */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-action/10 text-action">
                <Store size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">Informations boutique</h2>
                <p className="text-xs text-ink/50">Paramètres généraux de vente.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="delivery_fee" className={labelCls}>
                  <Truck size={16} className="text-ink/40" /> Frais de livraison (FCFA)
                </label>
                <input
                  id="delivery_fee"
                  name="delivery_fee"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={form.delivery_fee}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="currency" className={labelCls}>
                  <Coins size={16} className="text-ink/40" /> Devise
                </label>
                <input id="currency" name="currency" value={form.currency} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </section>

          {/* Carte Bandeau promo */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-action/10 text-action">
                <Pencil size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ink">Bandeau promotionnel (Accueil)</h2>
                <p className="text-xs text-ink/50">Texte affiché sur la page d'accueil.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 md:min-h-0 md:gap-2">
                <input
                  type="checkbox"
                  checked={form.promo_banner_enabled === 'true'}
                  onChange={(e) =>
                    setForm({ ...form, promo_banner_enabled: e.target.checked ? 'true' : 'false' })
                  }
                  className="size-5 accent-action md:size-4"
                />
                <span className="text-sm font-medium">Afficher le bandeau sur l'accueil</span>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="promo_banner_title" className={labelCls}>Titre</label>
                  <input id="promo_banner_title" name="promo_banner_title" value={form.promo_banner_title} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="promo_banner_subtitle" className={labelCls}>Sous-titre</label>
                  <input id="promo_banner_subtitle" name="promo_banner_subtitle" value={form.promo_banner_subtitle} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="promo_banner_button_label" className={labelCls}>Bouton (texte)</label>
                  <input id="promo_banner_button_label" name="promo_banner_button_label" value={form.promo_banner_button_label} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="promo_banner_link" className={labelCls}>Bouton (lien)</label>
                  <input id="promo_banner_link" name="promo_banner_link" value={form.promo_banner_link} onChange={handleChange} className={inputCls} />
                </div>
              </div>
            </div>
          </section>

          {/* Message d'état */}
          {msg && (
            <div
              role="status"
              className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-medium ${msg.ok
                  ? 'border-success/20 bg-success-soft text-success'
                  : 'border-action/20 bg-action-soft text-action'
                }`}
            >
              {msg.ok && <CheckCircle2 size={18} className="shrink-0" />}
              {msg.text}
            </div>
          )}

          <div className="flex md:justify-end">
            <button
              type="submit"
              disabled={saving}
              className="min-h-12 w-full rounded-lg bg-action px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:w-auto"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}