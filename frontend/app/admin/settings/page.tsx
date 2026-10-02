'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings, uploadImage, uploadVideo } from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({
    shop_name: '',
    delivery_fee: '',
    hero_title: '',
    hero_subtitle: '',
    hero_primary_label: '',
    hero_primary_link: '',
    hero_secondary_label: '',
    hero_secondary_link: '',
    hero_image: '',
    hero_video: '',
    promo_banner_enabled: 'true',
    promo_banner_title: '',
    promo_banner_subtitle: '',
    promo_banner_button_label: '',
    promo_banner_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, hero_image: url }));
    } catch {
      setMessage("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleHeroVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadVideo(file);
      setForm((f) => ({ ...f, hero_video: url }));
    } catch {
      setMessage("Échec de l'upload vidéo");
    } finally {
      setUploading(false);
    }
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
              <label className="block text-sm font-medium mb-1">Frais de livraison</label>
              <input name="delivery_fee" type="number" value={form.delivery_fee} onChange={handleChange}
                className="w-full border rounded px-3 py-2 bg-transparent" />
            </div>
          </div>
        </section>

        {/* Hero */}
        <section>
          <h2 className="text-xl font-bold mb-4">Bannière d'accueil (hero)</h2>
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
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <input type="file" accept="image/*" onChange={handleHeroImage} disabled={uploading}
                className="w-full text-sm" />
              {uploading && <p className="text-xs text-gray-500 mt-1">Upload en cours...</p>}
              {form.hero_image && (
                <div className="mt-3">
                  <img src={form.hero_image} alt="Hero" className="w-64 h-40 object-cover rounded border" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, hero_image: '' }))}
                    className="mt-2 text-sm text-red-500 hover:underline"
                  >
                    Supprimer l'image
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Vidéo (optionnelle — remplace l'image si définie)
              </label>
              <input type="file" accept="video/*" onChange={handleHeroVideo} disabled={uploading}
                className="w-full text-sm" />
              {form.hero_video && (
                <div className="mt-3">
                  <video src={form.hero_video} className="w-64 h-40 object-cover rounded border" muted />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, hero_video: '' }))}
                    className="mt-2 text-sm text-red-500 hover:underline"
                  >
                    Supprimer la vidéo
                  </button>
                </div>
              )}
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