'use client';
import { useEffect, useState } from 'react';
import {
  getAllHeroMedia, createHeroMedia, updateHeroMedia, deleteHeroMedia,
  uploadImage, uploadVideo,
} from '@/lib/api';
import {
  ImageIcon, Video, Eye, Trash2,
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
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl font-bold text-ink md:text-2xl">Bannière hero</h1>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 md:gap-3 md:p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-action/10 text-action md:size-10"><ImageIcon size={18} /></div>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink md:text-xl">{total}</p>
            <p className="truncate text-xs text-ink/50">Médias</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 md:gap-3 md:p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-soft text-success md:size-10"><Eye size={18} /></div>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink md:text-xl">{active}</p>
            <p className="truncate text-xs text-ink/50">Actifs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 md:gap-3 md:p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 md:size-10"><ImageIcon2 size={18} /></div>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink md:text-xl">{images}</p>
            <p className="truncate text-xs text-ink/50">Images</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 md:gap-3 md:p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 md:size-10"><Video size={18} /></div>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink md:text-xl">{videos}</p>
            <p className="truncate text-xs text-ink/50">Vidéos</p>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="relative mb-6 cursor-pointer rounded-2xl border-2 border-dashed border-line bg-white p-5 text-center transition hover:border-action md:mb-8 md:p-8">
        <input type="file" accept="image/*,video/*" onChange={handleUpload} disabled={uploading} className="absolute inset-0 size-full cursor-pointer opacity-0" />
        <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-full bg-action/10 text-action md:mb-3 md:size-12">
          {uploading ? <Loader2 className="animate-spin" size={22} /> : <Upload size={22} />}
        </div>
        <p className="text-base font-bold text-ink md:text-lg">{uploading ? 'Envoi en cours...' : 'Ajouter un média'}</p>
        <p className="mt-1 text-xs text-ink/50">Image ou vidéo</p>
      </div>

      <div className="mb-3 flex items-center justify-between md:mb-4">
        <h2 className="text-sm font-bold text-ink md:text-base">Médias actuels ({total})</h2>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-action" /></div>
      ) : media.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-8 text-center text-ink/50">Aucun média.</div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {media.map((m, i) => (
            <div key={m.id} className="p-3 transition hover:bg-canvas/30 md:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:gap-4">
                {/* Miniature */}
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg border border-line sm:h-20 sm:w-32 md:h-24 md:w-40">
                  {m.type === 'video' ? (
                    <video src={m.url} muted className="size-full object-cover" />
                  ) : (
                    <img src={m.url} alt="" className="size-full object-cover" />
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                    {m.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                    {m.type === 'video' ? 'Vidéo' : 'Image'}
                  </div>
                </div>

                {/* Infos */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink md:text-base">
                    Hero {m.type} {i + 1}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${m.isActive ? 'bg-success-soft text-success' : 'bg-canvas text-ink/50'}`}>
                      <span className={`size-1.5 rounded-full ${m.isActive ? 'bg-success' : 'bg-ink/30'}`} />
                      {m.isActive ? 'Actif' : 'Masqué'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink/50 transition hover:text-ink disabled:opacity-30">
                      <ArrowUp size={16} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === media.length - 1} aria-label="Descendre" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink/50 transition hover:text-ink disabled:opacity-30">
                      <ArrowDown size={16} />
                    </button>
                  </div>

                  <button onClick={() => toggleActive(m)} aria-label={m.isActive ? 'Masquer' : 'Activer'} className="flex min-h-10 items-center px-1">
                    <div className={`relative h-5 w-9 rounded-full transition-colors ${m.isActive ? 'bg-action' : 'bg-line'}`}>
                      <div className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${m.isActive ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
                  </button>

                  <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink transition hover:border-action hover:text-action">
                    <Upload size={14} /> <span className="hidden sm:inline">Remplacer</span>
                    <input type="file" accept={m.type === 'video' ? 'video/*' : 'image/*'} onChange={(e) => replaceFile(m, e)} disabled={uploading} className="hidden" />
                  </label>

                  <button onClick={() => remove(m)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg bg-action-soft text-action transition hover:bg-action hover:text-white">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}