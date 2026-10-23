'use client';
import { useEffect, useState } from 'react';
import { getSettings, updateSettings, uploadImage } from '@/lib/api';
import { parseAbout } from '@/lib/about';
import { 
  Loader2, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Plus, 
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
  
  // État pour afficher l'image en grand
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
      setPreviewOpen(false); // Ferme la popup après l'upload
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

  const inputCls = "w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-white";

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-action" size={32} /></div>;

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-action text-white flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">À propos</h1>
            <p className="text-sm text-ink/60">Modifiez le contenu de la page à propos de votre boutique.</p>
          </div>
        </div>

        <div className="space-y-6">
          
          <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
              <div className="w-8 h-8 rounded-lg bg-action/10 text-action flex items-center justify-center">
                <FileText size={18} />
              </div>
              <h2 className="text-lg font-bold text-ink">Contenu de la page</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-ink">Titre de la page</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="À propos" className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-ink">Image principale</label>
                <div className="w-full sm:w-80">
                  {image ? (
                    // Si l'image existe : on affiche l'image, et on l'ouvre en grand au clic
                    <div className="relative group aspect-video rounded-xl overflow-hidden border border-line bg-canvas cursor-pointer" onClick={() => setPreviewOpen(true)}>
                      <img src={image} alt="Aperçu" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-sm font-semibold flex items-center gap-2"><ImageIcon size={18} /> Voir l'image</span>
                      </div>
                    </div>
                  ) : (
                    // Si pas d'image : on affiche la zone pour uploader
                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-line hover:border-action bg-canvas/30 cursor-pointer transition">
                      {uploading ? <Loader2 size={24} className="text-action animate-spin mb-2" /> : <ImageIcon size={24} className="text-ink/40 mb-2" />}
                      <span className="text-sm font-semibold text-ink/60">{uploading ? 'Chargement...' : 'Ajouter une image'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ... (La partie Paragraphes reste identique) ... */}
          <section className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
              <div className="w-8 h-8 rounded-lg bg-action/10 text-action flex items-center justify-center"><FileText size={18} /></div>
              <h2 className="text-lg font-bold text-ink">Paragraphes</h2>
            </div>
            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <div key={i} className="flex gap-3 items-start bg-canvas/30 p-3 rounded-xl border border-line">
                  <div className="flex flex-col gap-1 mt-1 shrink-0">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30"><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === paragraphs.length - 1} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30"><ArrowDown size={16} /></button>
                  </div>
                  <textarea value={p} onChange={(e) => update(i, e.target.value)} placeholder={`Paragraphe ${i + 1}...`} rows={3} className="flex-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-action bg-white resize-none" />
                  <button type="button" onClick={() => remove(i)} disabled={paragraphs.length === 1} className="p-2 text-action bg-action-soft hover:bg-action hover:text-white rounded-lg transition disabled:opacity-30 mt-1 shrink-0" title="Supprimer ce paragraphe"><Trash2 size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={add} className="inline-flex items-center gap-2 text-sm font-semibold text-action hover:text-action-dark transition mt-2"><Plus size={16} /> Ajouter un paragraphe</button>
            </div>
          </section>

          {/* ... (Message et Bouton Enregistrer) ... */}
          {msg && (
            <div className={`p-4 rounded-xl border flex items-center gap-2 font-medium text-sm ${msg.ok ? 'bg-success-soft border-success/20 text-success' : 'bg-action-soft border-action/20 text-action'}`}>
              {msg.ok && <CheckCircle2 size={18} />}{msg.text}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={save} disabled={saving} className="bg-action text-white font-bold px-8 py-3 rounded-xl hover:bg-action-dark transition shadow-sm disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>

        </div>
      </div>

      {/* MODAL POUR VOIR L'IMAGE EN GRAND */}
      {previewOpen && image && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-w-3xl w-full">
            <img src={image} alt="Aperçu en grand" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            
            <div className="absolute top-4 right-4 flex gap-2">
              <label className="bg-white text-ink px-4 py-2 rounded-lg font-semibold cursor-pointer hover:bg-gray-100 flex items-center gap-2">
                <UploadCloud size={18} /> Changer l'image
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
              <button type="button" onClick={() => setPreviewOpen(false)} className="bg-white text-ink p-2 rounded-lg hover:bg-gray-100" title="Fermer">
                <X size={20} />
              </button>
            </div>
            
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); setImage(''); setPreviewOpen(false); }} 
              className="absolute bottom-4 right-4 bg-action text-white px-4 py-2 rounded-lg font-semibold hover:bg-action-dark flex items-center gap-2"
            >
              <Trash2 size={18} /> Supprimer
            </button>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}