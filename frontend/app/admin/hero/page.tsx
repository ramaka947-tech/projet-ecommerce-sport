'use client';
import { useEffect, useState } from 'react';
import {
  getAllHeroMedia, createHeroMedia, updateHeroMedia, deleteHeroMedia,
  uploadImage, uploadVideo,
} from '@/lib/api';
import { 
  Plus, ImageIcon, Video, Eye, EyeOff, Trash2, 
  ArrowUp, ArrowDown, Loader2, Upload, Image as ImageIcon2
} from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';

type Media = {
  id: string;
  type: string;
  url: string;
  position: number;
  isActive: boolean;
};

export default function AdminHeroPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getAllHeroMedia();
      setMedia([...list].sort((a: Media, b: Media) => a.position - b.position));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setUploading(true);
    try {
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      await createHeroMedia({ type: isVideo ? 'video' : 'image', url });
      await load();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'ajout");
    } finally {
      setUploading(false);
    }
  };

  const replaceFile = async (m: Media, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if ((m.type === 'video') !== isVideo) return alert(`Remplacez ${m.type === 'video' ? 'une vidéo' : 'une image'} par le même format.`);
    
    setUploading(true);
    try {
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      await updateHeroMedia(m.id, { url });
      await load();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du remplacement');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (m: Media) => {
    await updateHeroMedia(m.id, { isActive: !m.isActive });
    load();
  };

  const remove = async (m: Media) => {
    if (!confirm('Supprimer ce média ?')) return;
    await deleteHeroMedia(m.id);
    load();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= media.length) return;
    const copy = [...media];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setMedia(copy);
    await Promise.all(copy.map((m, idx) => updateHeroMedia(m.id, { position: idx })));
  };

  const total = media.length;
  const active = media.filter(m => m.isActive).length;
  const images = media.filter(m => m.type === 'image').length;
  const videos = media.filter(m => m.type === 'video').length;

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Bannière hero</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-action/10 text-action flex items-center justify-center"><ImageIcon size={20} /></div>
          <div><p className="text-xl font-bold text-ink">{total}</p><p className="text-xs text-ink/50">Médias totaux</p></div>
        </div>
        <div className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center"><Eye size={20} /></div>
          <div><p className="text-xl font-bold text-ink">{active}</p><p className="text-xs text-ink/50">Actifs</p></div>
        </div>
        <div className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ImageIcon2 size={20} /></div>
          <div><p className="text-xl font-bold text-ink">{images}</p><p className="text-xs text-ink/50">Images</p></div>
        </div>
        <div className="bg-white border border-line rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><Video size={20} /></div>
          <div><p className="text-xl font-bold text-ink">{videos}</p><p className="text-xs text-ink/50">Vidéos</p></div>
        </div>
      </div>

      {/* Zone d'upload */}
      <div className="bg-white border-2 border-dashed border-line hover:border-action transition rounded-2xl p-8 mb-8 text-center cursor-pointer relative">
        <input type="file" accept="image/*,video/*" onChange={handleUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-12 h-12 rounded-full bg-action/10 text-action flex items-center justify-center mx-auto mb-3">
          {uploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
        </div>
        <p className="font-bold text-ink text-lg">{uploading ? 'Envoi en cours...' : 'Ajouter un média'}</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-ink">Médias actuels ({total})</h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-action" /></div>
      ) : media.length === 0 ? (
        <div className="text-center text-ink/50 p-8 border border-line rounded-xl bg-white">Aucun média.</div>
      ) : (
        <div className="bg-white border border-line rounded-2xl overflow-hidden divide-y divide-line">
          {media.map((m, i) => (
            <div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 hover:bg-canvas/30 transition">
              
              {/* Miniature */}
              <div className="relative w-full sm:w-40 h-24 rounded-lg overflow-hidden shrink-0 border border-line">
                {m.type === 'video' ? (
                  <video src={m.url} muted className="w-full h-full object-cover" />
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  {m.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                  {m.type === 'video' ? 'Vidéo' : 'Image'}
                </div>
              </div>

              {/* Infos */}
              <div className="flex-1">
                <p className="font-bold text-ink">Hero {m.type} {i + 1}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${m.isActive ? 'bg-success-soft text-success' : 'bg-canvas text-ink/50'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? 'bg-success' : 'bg-ink/30'}`} />
                    {m.isActive ? 'Actif' : 'Masqué'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-ink/40 hover:text-ink bg-canvas rounded-lg disabled:opacity-30"><ArrowUp size={16} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === media.length - 1} className="p-2 text-ink/40 hover:text-ink bg-canvas rounded-lg disabled:opacity-30"><ArrowDown size={16} /></button>
                </div>
                
                {/* Toggle */}
                <button onClick={() => toggleActive(m)} className="mx-2">
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${m.isActive ? 'bg-action' : 'bg-line'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${m.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                  </div>
                </button>

                <label className="flex items-center gap-2 border border-line px-3 py-2 rounded-lg text-sm font-semibold text-ink hover:border-action hover:text-action cursor-pointer transition">
                  <Upload size={14} /> <span className="hidden sm:inline">Remplacer</span>
                  <input type="file" accept={m.type === 'video' ? 'video/*' : 'image/*'} onChange={(e) => replaceFile(m, e)} disabled={uploading} className="hidden" />
                </label>
                
                <button onClick={() => remove(m)} className="p-2 text-action bg-action-soft hover:bg-action hover:text-white rounded-lg transition"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}