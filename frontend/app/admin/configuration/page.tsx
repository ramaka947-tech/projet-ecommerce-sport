'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { Settings, Store, Truck, Coins, Loader2, Pencil, CheckCircle2 } from 'lucide-react';

export default function ConfigurationPage() {
  const [form, setForm] = useState({
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
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await updateSettings(form);
      setMsg({ ok: true, text: 'Configuration enregistrée avec succès.' });
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ ok: false, text: err.message || 'Erreur.' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 transition-colors";
  const textareaCls = `${inputCls} resize-none`;

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-action" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* En-tête */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-action text-white flex items-center justify-center">
          <Settings size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Configuration</h1>
          <p className="text-sm text-ink/60 mt-0.5">Gérez les paramètres généraux de votre boutique.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Carte Boutique */}
        <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
            <div className="w-8 h-8 rounded-lg bg-action/10 text-action flex items-center justify-center">
              <Store size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Informations Boutique</h2>
              <p className="text-xs text-ink/50">Paramètres généraux de vente.</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                <Truck size={16} className="text-ink/40" /> Frais de livraison (FCFA)
              </label>
              <input name="delivery_fee" type="number" value={form.delivery_fee} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                <Coins size={16} className="text-ink/40" /> Devise
              </label>
              <input name="currency" value={form.currency} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Carte Bandeau promo */}
        <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
            <div className="w-8 h-8 rounded-lg bg-action/10 text-action flex items-center justify-center">
              <Pencil size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Bandeau promotionnel (Accueil)</h2>
              <p className="text-xs text-ink/50">Texte affiché sur la page d'accueil.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.promo_banner_enabled === 'true'} 
                onChange={(e) => setForm({ ...form, promo_banner_enabled: e.target.checked ? 'true' : 'false' })} 
                className="w-4 h-4 accent-action"
              />
              <span className="text-sm font-medium">Afficher le bandeau sur l'accueil</span>
            </label>
            
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Titre</label>
                <input name="promo_banner_title" value={form.promo_banner_title} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Sous-titre</label>
                <input name="promo_banner_subtitle" value={form.promo_banner_subtitle} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Bouton (texte)</label>
                <input name="promo_banner_button_label" value={form.promo_banner_button_label} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Bouton (lien)</label>
                <input name="promo_banner_link" value={form.promo_banner_link} onChange={handleChange} className={inputCls} />
              </div>
            </div>
          </div>
        </section>

        {/* Message d'état */}
        {msg && (
          <div className={`p-4 rounded-xl border flex items-center gap-2 font-medium text-sm ${msg.ok ? 'bg-success-soft border-success/20 text-success' : 'bg-action-soft border-action/20 text-action'}`}>
            {msg.ok && <CheckCircle2 size={18} />}
            {msg.text}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-action text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-action-dark transition shadow-sm disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}