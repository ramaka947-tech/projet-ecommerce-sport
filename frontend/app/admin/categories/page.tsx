'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import {
  getCategories, createCategory, updateCategory, deleteCategory, uploadImage,
} from '@/lib/api';
import { Plus, Image as ImageIcon, Pencil, Trash2, LayoutGrid, Loader2 } from 'lucide-react';

/* ---------- Sélecteur de photo ---------- */
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
      <label className="relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-canvas border-2 border-dashed border-line hover:border-action cursor-pointer flex flex-col items-center justify-center text-ink/40 transition">
        {value ? (
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            {uploading ? <Loader2 size={24} className="animate-spin mb-1" /> : <ImageIcon size={24} className="mb-1" />}
            <span className="text-[10px] font-semibold uppercase text-center leading-tight px-2">Ajouter<br/>une image</span>
          </>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>
      <div className="text-xs text-ink/50">
        <p className="font-semibold text-ink/70 mb-1">Ajouter une image</p>
        <p>PNG, JPG ou WEBP</p>
        <p>Taille recommandée : 500 x 500 px</p>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-action font-semibold hover:underline mt-2">
            Retirer
          </button>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Catégories</h1>
        <p className="text-sm text-ink/60 mt-1">Organisez les catégories de votre boutique.</p>
      </div>

      {/* Formulaire de création (Nouvelle catégorie) */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center">
            <LayoutGrid size={18} />
          </div>
          <h2 className="text-lg font-bold text-ink">Nouvelle catégorie</h2>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col md:flex-row items-start md:items-end gap-6">
          <ImagePicker value={newImage} onChange={setNewImage} />
          
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Nom de la catégorie *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex : Chaussures, Vêtements..."
                className="w-full border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-action bg-canvas/30"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="w-full md:w-auto bg-action text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-action-dark transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Ajouter la catégorie
          </button>
        </form>
        {error && <p className="text-action text-sm mt-4">{error}</p>}
      </div>

      {/* Liste des catégories */}
      {loading ? (
        <div className="p-12 flex justify-center text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-ink/50 bg-white border border-line rounded-2xl">Aucune catégorie.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white border border-line rounded-2xl p-4 shadow-sm hover:shadow-md transition">
              
              {editingId === c.id ? (
                /* Mode ÉDITION */
                <div className="flex flex-col sm:flex-row gap-4">
                  <ImagePicker value={editImage} onChange={setEditImage} />
                  <div className="flex-1 space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:border-action outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(c.id)} disabled={saving} className="bg-ink text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-ink/50 hover:text-ink">
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode LECTURE (Design de ta capture) */
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-canvas border border-line shrink-0 flex items-center justify-center">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} className="text-ink/20" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink text-lg truncate">{c.name}</p>
                    <p className="text-sm text-ink/50">0 produits</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(c)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-canvas hover:bg-line text-ink text-xs font-semibold rounded-lg transition">
                      <Pencil size={14} /> Modifier
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-action bg-action-soft hover:bg-action hover:text-white rounded-lg transition">
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