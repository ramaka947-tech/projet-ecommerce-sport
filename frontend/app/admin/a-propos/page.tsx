'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings, uploadImage } from '@/lib/api';
import { parseAbout } from '@/lib/about';
import { Loader2 } from 'lucide-react';

export default function AdminAboutPage() {
  const [title, setTitle] = useState('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => {
        const a = parseAbout(s.about);
        setTitle(a.title);
        setParagraphs(a.paragraphs);
        setImage(a.image || '');
      })
      .catch(() => setMsg('Impossible de charger la page'));
  }, []);

  const update = (i: number, value: string) =>
    setParagraphs((p) => p.map((x, idx) => (idx === i ? value : x)));
  const add = () => setParagraphs((p) => [...p, '']);
  const remove = (i: number) =>
    setParagraphs((p) => p.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setParagraphs((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setImage(url);
    } catch {
      setMsg("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const clean = {
        title: title.trim() || 'À propos',
        paragraphs: paragraphs.map((p) => p.trim()).filter(Boolean),
        image: image.trim(),
      };
      await updateSettings({ about: JSON.stringify(clean) });
      setTitle(clean.title);
      setParagraphs(clean.paragraphs);
      setMsg('Page enregistrée ✅');
    } catch (e: any) {
      setMsg(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gérer la page « À propos »</h1>

      <label className="block text-sm font-medium mb-1">Grand titre</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="À propos"
        className="w-full border rounded px-3 py-2 mb-6 text-xl font-bold"
      />

      <label className="block text-sm font-medium mb-1">Image à droite (optionnel)</label>
      <div className="mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          className="w-full text-sm mb-2"
        />
        {uploading && (
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Upload en cours...
          </p>
        )}
        {image && (
          <div className="relative inline-block mt-2">
            <img src={image} alt="Aperçu" className="w-64 aspect-[16/10] object-cover rounded-lg border" />
            <button
              type="button"
              onClick={() => setImage('')}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <label className="block text-sm font-medium mb-2">Paragraphes</label>
      {paragraphs.map((p, i) => (
        <div key={i} className="border rounded-lg p-4 mb-4 space-y-2">
          <textarea
            value={p}
            onChange={(e) => update(i, e.target.value)}
            placeholder="Texte du paragraphe..."
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
          <div className="flex gap-3 text-sm">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0}>↑ Monter</button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === paragraphs.length - 1}>↓ Descendre</button>
            <button type="button" onClick={() => remove(i)} className="text-red-600">Supprimer</button>
          </div>
        </div>
      ))}

      <div className="flex gap-3 items-center">
        <button type="button" onClick={add} className="border px-4 py-2 rounded">
          + Ajouter un paragraphe
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <span>{msg}</span>
      </div>
    </div>
  );
}