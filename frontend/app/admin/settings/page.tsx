'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({
    shop_name: '',
    tagline: '',
    contact_email: '',
    contact_phone: '',
    currency: 'FCFA',
    delivery_fee: '',
    social_instagram: '',
    social_facebook: '',
    social_tiktok: '',
    social_whatsapp: '',
    hero_title: '',
    hero_subtitle: '',
    hero_primary_label: '',
    hero_primary_link: '',
    hero_secondary_label: '',
    hero_secondary_link: '',
    promo_banner_enabled: 'true',
    promo_banner_title: '',
    promo_banner_subtitle: '',
    promo_banner_button_label: '',
    promo_banner_link: '',
    shop_hero_image: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
    setMessage('');
    try {
      await updateSettings(form);
      setMessage('Enregistré.');
    } catch (err: any) {
      setMessage(err.message || 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Réglages</h1>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Boutique */}
        <section>
          <h2 className="text-xl font-bold mb-4">Boutique</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom de la boutique</label>
              <input name="shop_name" value={form.shop_name} onChange={handleChange}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slogan (footer)</label>
              <input name="tagline" value={form.tagline} onChange={handleChange}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frais de livraison</label>
                <input name="delivery_fee" type="number" value={form.delivery_fee} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Devise</label>
                <input name="currency" value={form.currency} onChange={handleChange}
                  placeholder="FCFA"
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-bold mb-4">Contact</h2>
          <p className="text-sm text-gray-500 mb-4">
            Affichés dans la barre du haut. Un champ vide n'est pas affiché.
            L'adresse de la boutique (avec la carte) se gère dans la page{' '}
            <a href="/admin/contact" className="underline">Contact</a>.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
                  placeholder="+221 77 000 00 00"
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Réseaux sociaux */}
        <section>
          <h2 className="text-xl font-bold mb-4">Réseaux sociaux</h2>
          <p className="text-sm text-gray-500 mb-4">
            Les liens doivent commencer par https://. Laissez vide pour masquer un réseau.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input name="social_instagram" value={form.social_instagram} onChange={handleChange}
                placeholder="https://instagram.com/..."
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <input name="social_facebook" value={form.social_facebook} onChange={handleChange}
                placeholder="https://facebook.com/..."
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TikTok</label>
              <input name="social_tiktok" value={form.social_tiktok} onChange={handleChange}
                placeholder="https://tiktok.com/@..."
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp (numéro)</label>
              <input name="social_whatsapp" value={form.social_whatsapp} onChange={handleChange}
                placeholder="+221 77 000 00 00"
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
          </div>
        </section>

        {/* Bannière boutique */}
        <section>
          <h2 className="text-xl font-bold mb-4">Bannière de la boutique</h2>
          <p className="text-sm text-gray-500 mb-4">
            Image affichée en haut de la page /boutique.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const { uploadImage } = await import('@/lib/api');
                  const url = await uploadImage(file);
                  setForm((f) => ({ ...f, shop_hero_image: url }));
                } catch {
                  setMessage("Échec de l'upload");
                }
              }}
              className="w-full text-sm"
            />
            {form.shop_hero_image && (
              <div className="mt-3">
                <img
                  src={form.shop_hero_image.replace('/upload/', '/upload/q_100,w_2400/')}
                  alt="Bannière boutique"
                  className="w-64 h-40 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, shop_hero_image: '' }))}
                  className="mt-2 text-sm text-red-500 hover:underline"
                >
                  Supprimer l'image
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Hero (texte) */}
        <section>
          <h2 className="text-xl font-bold mb-4">Bannière d'accueil (texte)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Pour gérer les images et vidéos de la bannière, utilisez la page{' '}
            <a href="/admin/hero" className="underline">Bannière hero</a>.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input name="hero_title" value={form.hero_title} onChange={handleChange}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sous-titre</label>
              <textarea name="hero_subtitle" value={form.hero_subtitle} onChange={handleChange}
                rows={2}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bouton principal — texte</label>
                <input name="hero_primary_label" value={form.hero_primary_label} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bouton principal — lien</label>
                <input name="hero_primary_link" value={form.hero_primary_link} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bouton secondaire — texte</label>
                <input name="hero_secondary_label" value={form.hero_secondary_label} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bouton secondaire — lien</label>
                <input name="hero_secondary_link" value={form.hero_secondary_link} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Bandeau promo */}
        <section>
          <h2 className="text-xl font-bold mb-4">Bandeau promotionnel</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox"
                checked={form.promo_banner_enabled === 'true'}
                onChange={(e) => setForm({ ...form, promo_banner_enabled: e.target.checked ? 'true' : 'false' })} />
              Afficher le bandeau sur l'accueil
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input name="promo_banner_title" value={form.promo_banner_title} onChange={handleChange}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sous-titre</label>
              <input name="promo_banner_subtitle" value={form.promo_banner_subtitle} onChange={handleChange}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bouton — texte</label>
                <input name="promo_banner_button_label" value={form.promo_banner_button_label} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bouton — lien</label>
                <input name="promo_banner_link" value={form.promo_banner_link} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 bg-transparent" />
              </div>
            </div>
          </div>
        </section>

        {message && <p className="text-sm text-green-600">{message}</p>}

        <button type="submit" disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}