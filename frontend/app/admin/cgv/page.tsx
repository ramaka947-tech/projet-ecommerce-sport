'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '@/lib/api';
import { parseCgv, type CgvSection } from '@/lib/cgv';
import {
  Loader2, Plus, Trash2, ArrowUp, ArrowDown,
  CheckCircle2, ShieldCheck
} from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';

export default function AdminCgvPage() {
  const [sections, setSections] = useState<CgvSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getSettings()
      .then((s) => setSections(parseCgv(s.cgv)))
      .catch(() => setMsg({ ok: false, text: 'Impossible de charger les CGV' }))
      .finally(() => setLoading(false));
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
    setMsg(null);
    try {
      const clean = sections
        .map((s) => ({ title: s.title.trim(), content: s.content.trim() }))
        .filter((s) => s.title || s.content);
      await updateSettings({ cgv: JSON.stringify(clean) });
      setSections(clean);
      setMsg({ ok: true, text: 'CGV enregistrées avec succès.' });
      setTimeout(() => setMsg(null), 4000);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-action" size={32} /></div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3 md:mb-8">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-action text-white md:size-12 md:rounded-2xl">
            <ShieldCheck size={20} className="md:hidden" />
            <ShieldCheck size={24} className="hidden md:block" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink md:text-2xl">Conditions Générales de Vente</h1>
            <p className="text-sm text-ink/60">Gérez les sections qui composent vos CGV.</p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          {sections.map((s, i) => (
            <section key={i} className="relative mt-4 rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
              <div className="absolute -top-4 left-4 flex size-8 items-center justify-center rounded-full border-4 border-canvas bg-ink text-sm font-bold text-white md:left-6">
                {i + 1}
              </div>

              <div className="mt-2 space-y-3 md:space-y-4">
                {/* Mobile : titre + boutons en colonne */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                  <input
                    value={s.title}
                    onChange={(e) => update(i, 'title', e.target.value)}
                    placeholder="Titre (ex : Livraison)"
                    className="min-h-11 w-full flex-1 rounded-lg border border-line bg-canvas/30 px-3 text-base font-bold text-ink focus:border-action focus:outline-none md:min-h-0 md:py-2.5 md:text-sm"
                  />
                  <div className="flex shrink-0 items-center justify-end gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink/50 transition hover:text-ink disabled:opacity-30">
                      <ArrowUp size={16} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Descendre" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink/50 transition hover:text-ink disabled:opacity-30">
                      <ArrowDown size={16} />
                    </button>
                    <button type="button" onClick={() => remove(i)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg text-action transition hover:bg-action-soft">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <textarea
                  value={s.content}
                  onChange={(e) => update(i, 'content', e.target.value)}
                  placeholder="Texte de la section..."
                  rows={4}
                  className="min-h-28 w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-action focus:outline-none md:min-h-0 md:text-sm"
                />
              </div>
            </section>
          ))}

          <button
            type="button"
            onClick={add}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white text-sm font-semibold text-action transition hover:border-action"
          >
            <Plus size={18} /> Ajouter une section
          </button>

          {msg && (
            <div className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-medium ${msg.ok ? 'border-success/20 bg-success-soft text-success' : 'border-action/20 bg-action-soft text-action'}`}>
              {msg.ok && <CheckCircle2 size={18} className="shrink-0" />}
              {msg.text}
            </div>
          )}

          <div className="flex pb-8 pt-2 md:justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-12 w-full rounded-xl bg-action px-8 py-3 font-bold text-white shadow-sm transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:w-auto"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}