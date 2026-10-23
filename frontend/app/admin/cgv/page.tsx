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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-action" size={32} /></div>;

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-action text-white flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">Conditions Générales de Vente</h1>
            <p className="text-sm text-ink/60">Gérez les sections qui composent vos CGV.</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {sections.map((s, i) => (
            <section key={i} className="bg-white border border-line rounded-2xl p-6 shadow-sm relative mt-4">
              {/* Numéro de section */}
              <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-bold text-sm border-4 border-canvas z-10">
                {i + 1}
              </div>

              <div className="space-y-4 mt-2">
                <div className="flex items-center gap-3">
                  <input
                    value={s.title}
                    onChange={(e) => update(i, 'title', e.target.value)}
                    placeholder="Titre (ex : Livraison)"
                    className="flex-1 border border-line rounded-lg px-3 py-2.5 text-sm font-bold text-ink focus:outline-none focus:border-action bg-canvas/30"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-ink/40 hover:text-ink bg-canvas rounded-lg disabled:opacity-30 transition"><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="p-2 text-ink/40 hover:text-ink bg-canvas rounded-lg disabled:opacity-30 transition"><ArrowDown size={16} /></button>
                    <button type="button" onClick={() => remove(i)} className="p-2 text-action hover:bg-action-soft rounded-lg transition ml-2" title="Supprimer cette section"><Trash2 size={18} /></button>
                  </div>
                </div>

                <textarea
                  value={s.content}
                  onChange={(e) => update(i, 'content', e.target.value)}
                  placeholder="Texte de la section..."
                  rows={4}
                  className="w-full border border-line rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-action bg-white resize-none"
                />
              </div>
            </section>
          ))}

          <button 
            type="button" 
            onClick={add} 
            className="w-full py-4 border-2 border-dashed border-line hover:border-action rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold text-action bg-white transition"
          >
            <Plus size={18} /> Ajouter une section
          </button>

          {/* Message de succès/erreur */}
          {msg && (
            <div className={`p-4 rounded-xl border flex items-center gap-2 font-medium text-sm ${msg.ok ? 'bg-success-soft border-success/20 text-success' : 'bg-action-soft border-action/20 text-action'}`}>
              {msg.ok && <CheckCircle2 size={18} />}
              {msg.text}
            </div>
          )}

          {/* Bouton Enregistrer */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-action text-white font-bold px-8 py-3 rounded-xl hover:bg-action-dark transition shadow-sm disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>

        </div>
      </div>
    </AdminGuard>
  );
}