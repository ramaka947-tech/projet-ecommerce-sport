'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct } from '@/lib/api';

type Props = {
  categories: any[];
  product?: any;
};

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    price: product?.price || '',
    promoPrice: product?.promoPrice || '',
    stock: product?.stock ?? 0,
    categoryId: product?.categoryId || '',
    isPublished: product?.isPublished ?? true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      price: parseFloat(form.price as any),
      promoPrice: form.promoPrice ? parseFloat(form.promoPrice as any) : undefined,
      stock: parseInt(form.stock as any, 10),
    };

    try {
      if (isEdit) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      router.push('/admin/produits');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 bg-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">SKU</label>
        <input
          name="sku"
          required
          value={form.sku}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 bg-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 bg-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Prix (€)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Prix promo (€)
          </label>
          <input
            name="promoPrice"
            type="number"
            step="0.01"
            value={form.promoPrice}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 bg-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            name="stock"
            type="number"
            required
            value={form.stock}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <select
            name="categoryId"
            required
            value={form.categoryId}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2 bg-transparent"
          >
            <option value="" className="text-black">
              -- Choisir --
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="text-black">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isPublished"
          checked={form.isPublished}
          onChange={handleChange}
        />
        Produit publié (visible sur la boutique)
      </label>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
      </button>
    </form>
  );
}