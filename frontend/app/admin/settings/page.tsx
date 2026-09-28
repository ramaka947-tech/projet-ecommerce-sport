'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';

export default function SettingsPage() {
  const [form, setForm] = useState({ shop_name: '', delivery_fee: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => setForm({
        shop_name: s.shop_name || '',
        delivery_fee: s.delivery_fee || '',
      }))
      .finally(() => setLoading(false));
  }, []);

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
    <div>
      <h1 className="text-3xl font-bold mb-8">Réglages</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de la boutique</label>
          <input
            value={form.shop_name}
            onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
            className="w-full border rounded px-3 py-2 bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Frais de livraison</label>
          <input
            type="number"
            value={form.delivery_fee}
            onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
            className="w-full border rounded px-3 py-2 bg-transparent"
          />
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}