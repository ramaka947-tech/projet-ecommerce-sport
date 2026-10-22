'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminGuard from '@/lib/admin-guard';
import { getSettings, updateSettings } from '@/lib/api';
import type { Location } from '@/components/LocationPicker';

// Leaflet a besoin de `window` : on le charge uniquement côté navigateur
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <p className="text-gray-500">Chargement de la carte...</p>,
});

const FIELDS = [
  { key: 'contact_intro', label: "Texte d'introduction", textarea: true },
  { key: 'contact_email', label: 'Email' },
  { key: 'contact_phone', label: 'Téléphone' },
  { key: 'social_whatsapp', label: 'WhatsApp (avec indicatif, ex : 221781129952)' },
];

export default function AdminContactPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<Location>({ address: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getSettings()
      .then((s: Record<string, string>) => {
        const initial: Record<string, string> = {};
        FIELDS.forEach((f) => (initial[f.key] = s[f.key] ?? ''));
        setForm(initial);
        setLocation({
          address: s.contact_address ?? '',
          lat: s.contact_lat ?? '',
          lng: s.contact_lng ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await updateSettings({
        ...form,
        contact_address: location.address,
        contact_lat: location.lat,
        contact_lng: location.lng,
      });
      setMsg({ ok: true, text: 'Informations de contact enregistrées.' });
    } catch (err: any) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Contact</h1>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm text-gray-500 mb-1">{f.label}</label>
              {f.textarea ? (
                <textarea
                  rows={3}
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-transparent"
                />
              ) : (
                <input
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 bg-transparent"
                />
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm text-gray-500 mb-2">Adresse de la boutique</label>
            <LocationPicker value={location} onChange={setLocation} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>

          {msg && <p className={msg.ok ? 'text-green-500' : 'text-red-500'}>{msg.text}</p>}
        </form>
      )}
    </AdminGuard>
  );
}