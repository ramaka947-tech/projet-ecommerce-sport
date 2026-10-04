'use client';
import { useEffect, useRef, useState } from 'react';
import { Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import {
  getAllHeroMedia,
  createHeroMedia,
  updateHeroMedia,
  deleteHeroMedia,
  uploadImage,
  uploadVideo,
} from '@/lib/api';

export default function HeroMediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMedia(await getAllHeroMedia());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      const isVideo = file.type.startsWith('video/');
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      await createHeroMedia({ type: isVideo ? 'video' : 'image', url });
      await load();
    } catch {
      setMessage("Erreur lors de l'upload.");
    } finally {
      setBusy(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleToggle = async (item: any) => {
    await updateHeroMedia(item.id, { isActive: !item.isActive });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce média ?')) return;
    await deleteHeroMedia(id);
    load();
  };

  const openReplace = (id: string) => {
    setReplacingId(id);
    replaceInputRef.current?.click();
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    setBusy(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const url = isVideo ? await uploadVideo(file) : await uploadImage(file);
      await updateHeroMedia(replacingId, { url });
      await load();
    } catch {
      setMessage('Erreur lors du remplacement.');
    } finally {
      setBusy(false);
      setReplacingId(null);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-2">Bannière hero</h1>
      <p className="text-sm text-gray-500 mb-8">
        Les médias actifs s'affichent en carrousel sur la page d'accueil. Survolez une vignette pour la remplacer, l'activer/désactiver ou la supprimer.
      </p>

      <div className="mb-6">
        <label className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg cursor-pointer hover:opacity-90">
          <Upload size={18} />
          {busy ? 'Upload...' : 'Ajouter une image ou vidéo'}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleAdd}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      {message && <p className="text-red-500 text-sm mb-4">{message}</p>}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : media.length === 0 ? (
        <p className="text-gray-500">Aucun média pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="relative group border rounded-lg overflow-hidden bg-white"
            >
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-40 object-cover" muted />
              ) : (
                <img src={item.url} alt="" className="w-full h-40 object-cover" />
              )}

              {!item.isActive && (
                <span className="absolute top-2 left-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded">
                  Désactivé
                </span>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                <button
                  onClick={() => openReplace(item.id)}
                  title="Remplacer"
                  className="bg-white p-2 rounded-full hover:bg-gray-100"
                >
                  <Upload size={18} />
                </button>
                <button
                  onClick={() => handleToggle(item)}
                  title={item.isActive ? 'Désactiver' : 'Activer'}
                  className="bg-white p-2 rounded-full hover:bg-gray-100"
                >
                  {item.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Supprimer"
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleReplace}
        className="hidden"
      />
    </AdminGuard>
  );
}