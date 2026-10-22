'use client';
import { useEffect, useState } from 'react';
import {
  getAllHeroMedia,
  createHeroMedia,
  updateHeroMedia,
  deleteHeroMedia,
  uploadImage,
  uploadVideo,
} from '@/lib/api';

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
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const list = await getAllHeroMedia();
      setMedia([...list].sort((a: Media, b: Media) => a.position - b.position));
    } catch {
      setMsg('Impossible de charger les médias');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setMsg('Fichier non supporté (image ou vidéo uniquement)');
      return;
    }

    setUploading(true);
    setMsg('');
    try {
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      await createHeroMedia({ type: isVideo ? 'video' : 'image', url });
      await load();
      setMsg('Média ajouté ✅');
    } catch (err: any) {
      setMsg(err.message || "Erreur lors de l'ajout");
    } finally {
      setUploading(false);
    }
  };

  const replaceFile = async (m: Media, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setMsg('Fichier non supporté');
      return;
    }
    if ((m.type === 'video') !== isVideo) {
      setMsg(
        `Remplacez ${m.type === 'video' ? 'une vidéo par une vidéo' : 'une image par une image'}`,
      );
      return;
    }

    setUploading(true);
    setMsg('');
    try {
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      await updateHeroMedia(m.id, { url });
      await load();
      setMsg('Média remplacé ✅');
    } catch (err: any) {
      setMsg(err.message || 'Erreur lors du remplacement');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (m: Media) => {
    try {
      await updateHeroMedia(m.id, { isActive: !m.isActive });
      await load();
    } catch (err: any) {
      setMsg(err.message || 'Erreur');
    }
  };

  const remove = async (m: Media) => {
    if (!confirm('Supprimer ce média ?')) return;
    try {
      await deleteHeroMedia(m.id);
      await load();
      setMsg('Média supprimé ✅');
    } catch (err: any) {
      setMsg(err.message || 'Erreur lors de la suppression');
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= media.length) return;
    const copy = [...media];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setMedia(copy);
    try {
      await Promise.all(copy.map((m, idx) => updateHeroMedia(m.id, { position: idx })));
    } catch (err: any) {
      setMsg(err.message || "Erreur lors du changement d'ordre");
      load();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Bannière hero</h1>
      <p className="text-sm text-gray-500 mb-6">
        Les textes de la bannière (titre, boutons) se modifient dans{' '}
        <a href="/admin/settings" className="underline">Réglages</a>.
      </p>

      {msg && <p className="mb-4 text-sm font-medium">{msg}</p>}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Images et vidéos</h2>
        <label className="bg-black text-white px-4 py-2 rounded cursor-pointer text-sm">
          {uploading ? 'Envoi en cours...' : '+ Ajouter une image / vidéo'}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {media.length === 0 && (
        <p className="text-gray-500 text-sm">Aucun média pour le moment.</p>
      )}

      <div className="space-y-3">
        {media.map((m, i) => (
          <div key={m.id} className="border rounded-lg p-3 flex items-center gap-4">
            <div className="w-40 h-24 bg-gray-100 rounded overflow-hidden shrink-0">
              {m.type === 'video' ? (
                <video src={m.url} muted className="w-full h-full object-cover" />
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="flex-1 text-sm">
              <p className="font-medium">
                {m.type === 'video' ? 'Vidéo' : 'Image'} n°{i + 1}
              </p>
              <p className={m.isActive ? 'text-green-600' : 'text-gray-400'}>
                {m.isActive ? 'Visible sur le site' : 'Masqué'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm items-center">
              <button onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === media.length - 1}>↓</button>
              <button onClick={() => toggleActive(m)}>
                {m.isActive ? 'Masquer' : 'Afficher'}
              </button>
              <label className="cursor-pointer underline">
                Remplacer
                <input
                  type="file"
                  accept={m.type === 'video' ? 'video/*' : 'image/*'}
                  onChange={(e) => replaceFile(m, e)}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <button onClick={() => remove(m)} className="text-red-600">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}