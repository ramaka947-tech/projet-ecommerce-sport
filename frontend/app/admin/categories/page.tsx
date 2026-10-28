'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import {
  getCategories, createCategory, updateCategory, deleteCategory, uploadImage,
} from '@/lib/api';
import { Plus, ImageIcon, Pencil, Trash2, LayoutGrid, Loader2 } from 'lucide-react';

function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch {
      alert("Échec de l'envoi de l'image");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4">
      <label className="relative flex size-20 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-line bg-canvas text-ink/40 transition hover:border-action md:size-24">
        {value ? (
          <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            {uploading ? <Loader2 size={24} className="mb-1 animate-spin" /> : <ImageIcon size={24} className="mb-1" />}
            <span className="px-2 text-center text-[10px] font-semibold uppercase leading-tight">Ajouter<br />une image</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>
      <div className="text-xs text-ink/50">
        <p className="mb-1 font-semibold text-ink/70">Ajouter une image</p>
        <p>PNG, JPG ou WEBP</p>
        <p>Taille recommandée : 500 x 500 px</p>
        {value && (
          <button type="button" onClick={() => onChange('')} className="mt-2 font-semibold text-action hover:underline">
            Retirer
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [creating, setCreating] = useState(false);

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

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    setCreating(true);
    try {
      await createCategory({ name: newName.trim(), imageUrl: newImage || undefined });
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
      await updateCategory(id, { name: editName.trim(), imageUrl: editImage || null });
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
      alert('Impossible de supprimer : des produits y sont peut-être liés.');
    }
  };

  return (
    <AdminGuard>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-bold text-ink md:text-3xl">Catégories</h1>
        <p className="mt-1 text-sm text-ink/60">Organisez les catégories de votre boutique.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-line bg-white p-4 shadow-sm md:mb-8 md:p-6">
        <div className="mb-4 flex items-center gap-3 md:mb-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-action text-white"><LayoutGrid size={18} /></div>
          <h2 className="text-base font-bold text-ink md:text-lg">Nouvelle catégorie</h2>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-5 md:flex-row md:items-end md:gap-6">
          <ImagePicker value={newImage} onChange={setNewImage} />

          <div className="w-full flex-1">
            <label htmlFor="cat_name" className="mb-1.5 block text-sm font-semibold">Nom de la catégorie *</label>
            <input
              id="cat_name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Chaussures, Vêtements..."
              className="min-h-11 w-full rounded-lg border border-line bg-canvas/30 px-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2.5 md:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-action px-6 font-semibold text-white transition hover:bg-action-dark disabled:opacity-50 md:min-h-0 md:w-auto md:py-2.5"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Ajouter la catégorie
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-action">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-12 text-center text-ink/50">Aucune catégorie.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-white p-3 shadow-sm transition hover:shadow-md md:p-4">
              {editingId === c.id ? (
                <div className="flex flex-col gap-4 sm:flex-row">
                  <ImagePicker value={editImage} onChange={setEditImage} />
                  <div className="flex-1 space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-h-11 w-full rounded-lg border border-line px-3 text-base outline-none focus:border-action md:min-h-0 md:py-2 md:text-sm"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(c.id)} disabled={saving} className="min-h-11 flex-1 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:opacity-90 md:min-h-0 md:flex-none md:py-1.5 md:text-xs">
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="min-h-11 flex-1 rounded-lg text-sm font-semibold text-ink/50 hover:text-ink md:min-h-0 md:flex-none md:py-1.5 md:text-xs">
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas md:size-20">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="size-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-ink/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-ink md:text-lg">{c.name}</p>
                    <p className="text-xs text-ink/50 md:text-sm">0 produits</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                    <button onClick={() => startEdit(c)} aria-label="Modifier" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink transition hover:bg-line md:size-auto md:px-3 md:py-2">
                      <Pencil size={14} />
                      <span className="ml-1.5 hidden text-xs font-semibold md:inline">Modifier</span>
                    </button>
                    <button onClick={() => handleDelete(c.id)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg bg-action-soft text-action transition hover:bg-action hover:text-white md:size-auto md:p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}