'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct, uploadImage, getSizes, getColors } from '@/lib/api';

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
    images: product?.images || [],
    sizes: product?.sizes || [],
    colors: product?.colors || [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [onSale, setOnSale] = useState(!!product?.promoPrice);

  useEffect(() => {
    getSizes().then(setAvailableSizes).catch(() => { });
    getColors().then(setAvailableColors).catch(() => { });
  }, []);

  const toggleSize = (name: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(name)
        ? f.sizes.filter((s: string) => s !== name)
        : [...f.sizes, name],
    }));
  };

  const toggleColor = (name: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(name)
        ? f.colors.filter((c: string) => c !== name)
        : [...f.colors, name],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err: any) {
      setError('Échec de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((i: string) => i !== url) }));
  };

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
      promoPrice: onSale && form.promoPrice ? parseFloat(form.promoPrice as any) : null,
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onSale}
              onChange={(e) => setOnSale(e.target.checked)}
            />
            En promotion
          </label>

          {onSale && (
            <div>
              <label className="block text-sm font-medium mb-1">Prix promo (€)</label>
              <input
                name="promoPrice"
                type="number"
                step="0.01"
                required
                value={form.promoPrice}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 bg-transparent"
              />
            </div>
          )}

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

      <div>
        <label className="block text-sm font-medium mb-2">
          Tailles disponibles (optionnel)
        </label>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => (
            <label
              key={s.id}
              className={`border rounded px-3 py-1 text-sm cursor-pointer ${form.sizes.includes(s.name) ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={form.sizes.includes(s.name)}
                onChange={() => toggleSize(s.name)}
              />
              {s.name}
            </label>
          ))}
          {availableSizes.length === 0 && (
            <p className="text-sm text-gray-500">
              Aucune taille définie. Ajoutez-en dans{' '}
              <a href="/admin/attributs" className="underline">
                Tailles & couleurs
              </a>
              .
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Couleurs disponibles (optionnel)
        </label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((c) => (
            <label
              key={c.id}
              className={`border rounded px-3 py-1 text-sm cursor-pointer ${form.colors.includes(c.name) ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={form.colors.includes(c.name)}
                onChange={() => toggleColor(c.name)}
              />
              {c.name}
            </label>
          ))}
          {availableColors.length === 0 && (
            <p className="text-sm text-gray-500">
              Aucune couleur définie. Ajoutez-en dans{' '}
              <a href="/admin/attributs" className="underline">
                Tailles & couleurs
              </a>
              .
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          disabled={uploading}
          className="w-full text-sm"
        />
        {uploading && <p className="text-xs text-gray-500 mt-1">Upload en cours...</p>}
        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {form.images.map((url: string) => (
              <div key={url} className="relative">
                <img src={url} alt="" className="w-24 h-24 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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