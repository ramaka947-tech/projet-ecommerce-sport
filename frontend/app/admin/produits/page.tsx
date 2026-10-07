'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getProducts, deleteProduct } from '@/lib/api';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getProducts({ includeOutOfStock: 'true' });
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await deleteProduct(id);
    load();
  };

  return (
    <AdminGuard>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Produits</h1>
        <Link
          href="/admin/produits/nouveau"
          className="bg-black text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          + Ajouter un produit
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-2">Nom</th>
              <th className="pb-2">SKU</th>
              <th className="pb-2">Prix</th>
              <th className="pb-2">Stock</th>
              <th className="pb-2">Catégorie</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-3">{p.name}</td>
                <td className="py-3">{p.sku}</td>
                <td className="py-3">{p.price} €</td>
                <td className="py-3">
                  {p.stock === 0 ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Rupture</span>
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="py-3">{p.category?.name}</td>
                <td className="py-3 text-right space-x-3">
                  <Link
                    href={`/admin/produits/${p.id}`}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminGuard>
  );
}