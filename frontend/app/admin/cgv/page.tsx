'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { parseCgv, type CgvSection } from '@/lib/cgv';

export default function AdminCgvPage() {
  const [sections, setSections] = useState<CgvSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => setSections(parseCgv(s.cgv)))
      .catch(() => setMsg('Impossible de charger les CGV'));
  }, []);

  const update = (i: number, field: keyof CgvSection, value: string) =>
    setSections((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    );

  const add = () => setSections((p) => [...p, { title: '', content: '' }]);
  const remove = (i: number) =>
    setSections((p) => p.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setSections((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const clean = sections
        .map((s) => ({ title: s.title.trim(), content: s.content.trim() }))
        .filter((s) => s.title || s.content);
      await updateSettings({ cgv: JSON.stringify(clean) });
      setSections(clean);
      setMsg('CGV enregistrées ✅');
    } catch (e: any) {
      setMsg(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gérer les CGV</h1>

      {sections.map((s, i) => (
        <div key={i} className="border rounded-lg p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-bold">{i + 1}.</span>
            <input
              value={s.title}
              onChange={(e) => update(i, 'title', e.target.value)}
              placeholder="Titre (ex : Livraison)"
              className="flex-1 border rounded px-3 py-2 font-bold"
            />
            <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
            <button onClick={() => move(i, 1)} disabled={i === sections.length - 1}>↓</button>
            <button onClick={() => remove(i)} className="text-red-600">
              Supprimer
            </button>
          </div>
          <textarea
            value={s.content}
            onChange={(e) => update(i, 'content', e.target.value)}
            placeholder="Texte de la section..."
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      ))}

      <div className="flex gap-3 items-center">
        <button onClick={add} className="border px-4 py-2 rounded">
          + Ajouter une section
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