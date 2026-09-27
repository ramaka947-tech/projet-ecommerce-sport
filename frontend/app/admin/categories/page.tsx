'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getCategories, createCategory, deleteCategory } from '@/lib/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

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
    try {
      await createCategory({ name: newName });
      setNewName('');
      load();
    } catch {
      setError('Erreur lors de la création');
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

      <form onSubmit={handleCreate} className="flex gap-2 mb-6 max-w-md">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom de la catégorie"
          className="flex-1 border rounded-lg px-3 py-2 bg-transparent"
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Ajouter
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <ul className="max-w-md space-y-2">
          {categories.map((c) => (
            <li
              key={c.id}
              className="flex justify-between items-center border rounded-lg px-4 py-2"
            >
              <span>{c.name}</span>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-red-500 hover:underline text-sm"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminGuard>
  );
}