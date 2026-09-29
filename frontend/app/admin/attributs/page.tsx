'use client';
import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import {
  getSizes, createSize, deleteSize,
  getColors, createColor, deleteColor,
} from '@/lib/api';

export default function AttributesPage() {
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  const load = async () => {
    setSizes(await getSizes());
    setColors(await getColors());
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSize.trim()) return;
    await createSize(newSize.trim());
    setNewSize('');
    load();
  };

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColor.trim()) return;
    await createColor(newColor.trim());
    setNewColor('');
    load();
  };

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Tailles et couleurs</h1>

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl">
        <div>
          <h2 className="font-semibold text-lg mb-4">Tailles</h2>
          <form onSubmit={handleAddSize} className="flex gap-2 mb-4">
            <input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="Ex: S, M, L, XL"
              className="flex-1 border rounded px-3 py-2 bg-transparent"
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:opacity-90"
            >
              Ajouter
            </button>
          </form>
          <ul className="space-y-2">
            {sizes.map((s) => (
              <li key={s.id} className="flex justify-between border rounded px-3 py-2">
                <span>{s.name}</span>
                <button
                  onClick={() => deleteSize(s.id).then(load)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))}
            {sizes.length === 0 && <p className="text-gray-500 text-sm">Aucune taille.</p>}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4">Couleurs</h2>
          <form onSubmit={handleAddColor} className="flex gap-2 mb-4">
            <input
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="Ex: Rouge, Bleu, Noir"
              className="flex-1 border rounded px-3 py-2 bg-transparent"
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:opacity-90"
            >
              Ajouter
            </button>
          </form>
          <ul className="space-y-2">
            {colors.map((c) => (
              <li key={c.id} className="flex justify-between border rounded px-3 py-2">
                <span>{c.name}</span>
                <button
                  onClick={() => deleteColor(c.id).then(load)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))}
            {colors.length === 0 && <p className="text-gray-500 text-sm">Aucune couleur.</p>}
          </ul>
        </div>
      </div>
    </AdminGuard>
  );
}