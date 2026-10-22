'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadImage,
} from '@/lib/api';

/* ---------- Sélecteur de photo (aperçu en rond) ---------- */
function RoundImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      onChange(await uploadImage(file));
    } catch {
      setErr("Échec de l'envoi de l'image");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-gray-500 cursor-pointer flex items-center justify-center text-gray-400 text-xs text-center">
        {value ? (
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span>{uploading ? '...' : '+ Photo'}</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          disabled={uploading}
        />
      </label>
      <div className="text-xs space-y-1">
        {uploading && <p className="text-gray-500">Envoi en cours...</p>}
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-red-500 hover:underline"
          >
            Retirer la photo
          </button>
        )}
        {err && <p className="text-red-500">{err}</p>}
        {!value && !uploading && (
          <p className="text-gray-400">Image carrée conseillée</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Création
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [creating, setCreating] = useState(false);

  // Modification
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setCreating(true);
    try {
      await createCategory({
        name: newName.trim(),
        imageUrl: newImage || undefined,
      });
      setNewName('');
      setNewImage('');
      await load();
    } catch {
      setError('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditImage(c.imageUrl || '');
    setError('');
  };

  const handleSave = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateCategory(id, {
        name: editName.trim(),
        imageUrl: editImage || null,
      });
      setEditingId(null);
      await load();
    } catch {
      setError('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await deleteCategory(id);
      load();
    } catch {
      alert(
        'Impossible de supprimer : des produits sont peut-être liés à cette catégorie.',
      );
    }
  };

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Catégories</h1>

      {/* Ajout */}
      <form
        onSubmit={handleCreate}
        className="max-w-xl border rounded-xl p-5 mb-8 space-y-4"
      >
        <h2 className="font-semibold">Nouvelle catégorie</h2>
        <RoundImagePicker value={newImage} onChange={setNewImage} />
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de la catégorie"
            className="flex-1 border rounded-lg px-3 py-2 bg-transparent"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {creating ? '...' : 'Ajouter'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Liste */}
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">Aucune catégorie.</p>
      ) : (
        <ul className="max-w-xl space-y-3">
          {categories.map((c) => (
            <li key={c.id} className="border rounded-xl px-4 py-3">
              {editingId === c.id ? (
                <div className="space-y-3">
                  <RoundImagePicker value={editImage} onChange={setEditImage} />
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 bg-transparent"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(c.id)}
                      disabled={saving || !editName.trim()}
                      className="bg-black text-white px-4 py-1.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-lg font-semibold">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <button
                    onClick={() => startEdit(c)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminGuard>
  );
}