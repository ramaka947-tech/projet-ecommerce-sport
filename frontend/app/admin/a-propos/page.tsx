'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings, uploadImage } from '@/lib/api';
import { parseAbout } from '@/lib/about';
import {
  Loader2, ImageIcon, Trash2, ArrowUp, ArrowDown, Plus,
  FileText, CheckCircle2, UploadCloud, X
} from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';

export default function AdminAboutPage() {
  const [title, setTitle] = useState('');
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        const a = parseAbout(s.about);
        setTitle(a.title);
        setParagraphs(a.paragraphs.length > 0 ? a.paragraphs : ['']);
        setImage(a.image || '');
      })
      .catch(() => setMsg({ ok: false, text: 'Impossible de charger la page' }))
      .finally(() => setLoading(false));
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
      setPreviewOpen(false);
    } catch {
      setMsg({ ok: false, text: "Échec de l'upload de l'image" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const clean = {
        title: title.trim() || 'À propos',
        paragraphs: paragraphs.map((p) => p.trim()).filter(Boolean),
        image: image.trim(),
      };
      await updateSettings({ about: JSON.stringify(clean) });
      setMsg({ ok: true, text: 'Page enregistrée avec succès.' });
      setTimeout(() => setMsg(null), 4000);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message || "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-action focus:outline-none md:min-h-0 md:text-sm';

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
            <FileText size={20} className="md:hidden" />
            <FileText size={24} className="hidden md:block" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink md:text-2xl">À propos</h1>
            <p className="text-sm text-ink/60">Modifiez le contenu de la page à propos de votre boutique.</p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-3 md:mb-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-action/10 text-action">
                <FileText size={18} />
              </div>
              <h2 className="text-base font-bold text-ink md:text-lg">Contenu de la page</h2>
            </div>

            <div className="space-y-5 md:space-y-6">
              <div>
                <label htmlFor="about_title" className="mb-1.5 block text-sm font-semibold text-ink">Titre de la page</label>
                <input
                  id="about_title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="À propos"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Image principale</label>
                <div className="w-full sm:w-80">
                  {image ? (
                    <div
                      className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-line bg-canvas"
                      onClick={() => setPreviewOpen(true)}
                    >
                      <img src={image} alt="Aperçu" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <span className="flex items-center gap-2 text-sm font-semibold text-white"><ImageIcon size={18} /> Voir l'image</span>
                      </div>
                    </div>
                  ) : (
                    <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-canvas/30 transition hover:border-action">
                      {uploading ? <Loader2 size={24} className="mb-2 animate-spin text-action" /> : <ImageIcon size={24} className="mb-2 text-ink/40" />}
                      <span className="text-sm font-semibold text-ink/60">{uploading ? 'Chargement...' : 'Ajouter une image'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-3 md:mb-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-action/10 text-action"><FileText size={18} /></div>
              <h2 className="text-base font-bold text-ink md:text-lg">Paragraphes</h2>
            </div>
            <div className="space-y-3 md:space-y-4">
              {paragraphs.map((p, i) => (
                <div key={i} className="rounded-xl border border-line bg-canvas/30 p-3">
                  {/* Sur mobile : boutons en haut à droite */}
                  <div className="mb-2 flex items-center justify-between gap-2 md:hidden">
                    <span className="text-xs font-semibold text-ink/50">Paragraphe {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="flex size-9 items-center justify-center rounded-lg text-ink/50 hover:bg-white hover:text-ink disabled:opacity-30">
                        <ArrowUp size={16} />
                      </button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === paragraphs.length - 1} aria-label="Descendre" className="flex size-9 items-center justify-center rounded-lg text-ink/50 hover:bg-white hover:text-ink disabled:opacity-30">
                        <ArrowDown size={16} />
                      </button>
                      <button type="button" onClick={() => remove(i)} disabled={paragraphs.length === 1} aria-label="Supprimer" className="flex size-9 items-center justify-center rounded-lg bg-action-soft text-action hover:bg-action hover:text-white disabled:opacity-30">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Flèches desktop */}
                    <div className="mt-1 hidden shrink-0 flex-col gap-1 md:flex">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === paragraphs.length - 1} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30"><ArrowDown size={16} /></button>
                    </div>
                    <textarea
                      value={p}
                      onChange={(e) => update(i, e.target.value)}
                      placeholder={`Paragraphe ${i + 1}...`}
                      rows={3}
                      className="min-h-24 w-full flex-1 resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-action focus:outline-none md:min-h-0 md:text-sm"
                    />
                    {/* Poubelle desktop */}
                    <button type="button" onClick={() => remove(i)} disabled={paragraphs.length === 1} className="mt-1 hidden shrink-0 rounded-lg bg-action-soft p-2 text-action transition hover:bg-action hover:text-white disabled:opacity-30 md:block" title="Supprimer ce paragraphe">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={add} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-action transition hover:text-action-dark md:min-h-0">
                <Plus size={16} /> Ajouter un paragraphe
              </button>
            </div>
          </section>

          {msg && (
            <div className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-medium ${msg.ok ? 'border-success/20 bg-success-soft text-success' : 'border-action/20 bg-action-soft text-action'}`}>
              {msg.ok && <CheckCircle2 size={18} className="shrink-0" />}{msg.text}
            </div>
          )}

          <div className="flex pt-2 md:justify-end">
            <button onClick={save} disabled={saving} className="min-h-12 w-full rounded-xl bg-action px-8 py-3 font-bold text-white shadow-sm transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:w-auto">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>

      {previewOpen && image && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative w-full max-w-3xl">
            <img src={image} alt="Aperçu en grand" className="max-h-[70vh] w-full rounded-lg object-contain md:max-h-[80vh]" />

            <div className="absolute right-3 top-3 flex gap-2 md:right-4 md:top-4">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-gray-100 md:min-h-0 md:px-4">
                <UploadCloud size={18} /> <span className="hidden sm:inline">Changer l'image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fermer" className="flex size-10 items-center justify-center rounded-lg bg-white text-ink hover:bg-gray-100 md:size-auto md:p-2">
                <X size={20} />
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setImage(''); setPreviewOpen(false); }}
              className="absolute bottom-3 right-3 flex min-h-10 items-center gap-2 rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-dark md:bottom-4 md:right-4 md:min-h-0"
            >
              <Trash2 size={18} /> Supprimer
            </button>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}