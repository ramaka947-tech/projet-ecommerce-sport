'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  createProduct,
  updateProduct,
  uploadImage,
  getSizes,
  getColors,
  getBrands,
} from '@/lib/api';
import { compareSizes, sizeGroupOf } from '@/lib/sizes';

type Props = {
  categories: any[];
  product?: any;
};

type Spec = { label: string; value: string; summary?: boolean };

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
    isFeatured: product?.isFeatured ?? false,
    images: product?.images || [],
    sizes: product?.sizes || [],
    colors: product?.colors || [],
    brands: product?.brands || [],
  });

  // Contenu de la page produit
  const [shortDescription, setShortDescription] = useState<string>(product?.shortDescription || '');
  const [highlightsText, setHighlightsText] = useState<string>(
    Array.isArray(product?.highlights) ? product.highlights.join('\n') : '',
  );
  const [specs, setSpecs] = useState<Spec[]>(Array.isArray(product?.specs) ? product.specs : []);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [availableBrands, setAvailableBrands] = useState<any[]>([]);
  const [onSale, setOnSale] = useState(!!product?.promoPrice);
  const [sizeGroup, setSizeGroup] = useState('');

  useEffect(() => {
    getSizes().then(setAvailableSizes).catch(() => {});
    getColors().then(setAvailableColors).catch(() => {});
    getBrands().then(setAvailableBrands).catch(() => {});
  }, []);

  /* ---------- Type de tailles : Vêtements / Chaussures ---------- */

  const groups = useMemo(
    () => Array.from(new Set(availableSizes.map(sizeGroupOf))),
    [availableSizes],
  );

  // Choix initial : déduit des tailles déjà cochées, sinon le premier groupe
  useEffect(() => {
    if (sizeGroup || availableSizes.length === 0) return;
    const firstPicked = availableSizes.find((s) => form.sizes.includes(s.name));
    setSizeGroup(firstPicked ? sizeGroupOf(firstPicked) : (groups[0] ?? ''));
  }, [availableSizes, groups, sizeGroup, form.sizes]);

  const visibleSizes = useMemo(
    () =>
      availableSizes
        .filter((s) => !sizeGroup || sizeGroupOf(s) === sizeGroup)
        .sort((a, b) => compareSizes(a.name, b.name)),
    [availableSizes, sizeGroup],
  );

  const changeSizeGroup = (g: string) => {
    setSizeGroup(g);
    // On retire les tailles qui n'appartiennent pas au nouveau type
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((name: string) =>
        availableSizes.some((s) => s.name === name && sizeGroupOf(s) === g),
      ),
    }));
  };

  const isShoes = sizeGroup.toLowerCase().startsWith('chaussure');

  /* ---------- Cases à cocher ---------- */

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

  const toggleBrand = (name: string) => {
    setForm((f) => ({
      ...f,
      brands: f.brands.includes(name)
        ? f.brands.filter((b: string) => b !== name)
        : [...f.brands, name],
    }));
  };

  /* ---------- Images ---------- */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadImage));
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err: any) {
      setError("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((i: string) => i !== url) }));
  };

  /* ---------- Caractéristiques ---------- */

  const updateSpec = (i: number, patch: Partial<Spec>) =>
    setSpecs((list) => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSpec = () => setSpecs((list) => [...list, { label: '', value: '', summary: false }]);
  const removeSpec = (i: number) => setSpecs((list) => list.filter((_, idx) => idx !== i));
  const summaryCount = specs.filter((s) => s.summary).length;

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

    const payload: Record<string, any> = {
      ...form,
      price: parseFloat(form.price as any),
      promoPrice: onSale && form.promoPrice ? parseFloat(form.promoPrice as any) : null,
      stock: parseInt(form.stock as any, 10),
    };

    // Nouveaux champs : envoyés seulement s'ils sont remplis, ou si le produit
    // les connaît déjà (permet de les vider). Évite de casser l'API avant sa mise à jour.
    const extras: Record<string, any> = {
      shortDescription: shortDescription.trim(),
      highlights: highlightsText.split('\n').map((s) => s.trim()).filter(Boolean),
      specs: specs
        .filter((s) => s.label.trim() && s.value.trim())
        .map((s) => ({ label: s.label.trim(), value: s.value.trim(), summary: !!s.summary })),
    };
    Object.entries(extras).forEach(([key, value]) => {
      const filled = Array.isArray(value) ? value.length > 0 : !!value;
      if (filled) payload[key] = value;
      else if (isEdit && key in product) payload[key] = Array.isArray(value) ? [] : null;
    });

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

  const inputCls = 'w-full border rounded-lg px-3 py-2 bg-transparent';
  const chipCls = (active: boolean) =>
    `border rounded px-3 py-1 text-sm cursor-pointer ${active ? 'bg-black text-white' : 'hover:bg-gray-100'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input name="name" required value={form.name} onChange={handleChange} className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">SKU</label>
        <input name="sku" required value={form.sku} onChange={handleChange} className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description courte <span className="font-normal text-gray-500">(sous le prix)</span>
        </label>
        <textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          rows={2}
          maxLength={300}
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description complète</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Prix (FCFA)</label>
          <input
            name="price"
            type="number"
            step="1"
            required
            value={form.price}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            name="stock"
            type="number"
            required
            value={form.stock}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} />
          En promotion
        </label>

        {onSale && (
          <div>
            <label className="block text-sm font-medium mb-1">Prix promo (FCFA)</label>
            <input
              name="promoPrice"
              type="number"
              step="1"
              required
              value={form.promoPrice}
              onChange={handleChange}
              className={inputCls}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Catégorie</label>
        <select
          name="categoryId"
          required
          value={form.categoryId}
          onChange={handleChange}
          className={inputCls}
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

      <div>
        <label className="block text-sm font-medium mb-2">Marques disponibles (optionnel)</label>
        <div className="flex flex-wrap gap-2">
          {availableBrands.map((b) => (
            <label key={b.id} className={chipCls(form.brands.includes(b.name))}>
              <input
                type="checkbox"
                className="hidden"
                checked={form.brands.includes(b.name)}
                onChange={() => toggleBrand(b.name)}
              />
              {b.name}
            </label>
          ))}
          {availableBrands.length === 0 && (
            <p className="text-sm text-gray-500">
              Aucune marque définie. Ajoutez-en dans{' '}
              <a href="/admin/attributs" className="underline">Variantes</a>.
            </p>
          )}
        </div>
      </div>

      {/* Tailles : le type décide des valeurs proposées */}
      <div>
        <label className="block text-sm font-medium mb-2">Tailles disponibles (optionnel)</label>

        {groups.length > 1 && (
          <div className="mb-3">
            <div className="inline-flex rounded-lg border overflow-hidden">
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => changeSizeGroup(g)}
                  className={`px-4 py-1.5 text-sm transition ${
                    sizeGroup === g ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isShoes
                ? 'Pointures : 40, 41, 42…'
                : 'Tailles : S, M, L…'}{' '}
              Changer de type retire les tailles déjà cochées.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {visibleSizes.map((s) => (
            <label key={s.id} className={chipCls(form.sizes.includes(s.name))}>
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
              <a href="/admin/attributs" className="underline">Variantes</a>.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Couleurs disponibles (optionnel)</label>
        <div className="flex flex-wrap gap-2">
          {availableColors.map((c) => (
            <label key={c.id} className={chipCls(form.colors.includes(c.name))}>
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
              <a href="/admin/attributs" className="underline">Variantes</a>.
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

      {/* Contenu de la page produit */}
      <div className="space-y-4 border-t pt-4">
        <h2 className="font-semibold">Page produit</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            Points forts <span className="font-normal text-gray-500">(un par ligne)</span>
          </label>
          <textarea
            value={highlightsText}
            onChange={(e) => setHighlightsText(e.target.value)}
            rows={4}
            placeholder={'Excellente adhérence\nConfort optimal\nLégèreté et respirabilité'}
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Caractéristiques</label>
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={s.label}
                  onChange={(e) => updateSpec(i, { label: e.target.value })}
                  placeholder="Libellé (ex : Matériau)"
                  className="flex-1 border rounded-lg px-3 py-2 bg-transparent text-sm"
                />
                <input
                  value={s.value}
                  onChange={(e) => updateSpec(i, { value: e.target.value })}
                  placeholder="Valeur (ex : Synthétique)"
                  className="flex-1 border rounded-lg px-3 py-2 bg-transparent text-sm"
                />
                <label
                  className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap"
                  title="Afficher en résumé sous le prix (3 maximum)"
                >
                  <input
                    type="checkbox"
                    checked={!!s.summary}
                    disabled={!s.summary && summaryCount >= 3}
                    onChange={(e) => updateSpec(i, { summary: e.target.checked })}
                  />
                  Résumé
                </label>
                <button
                  type="button"
                  onClick={() => removeSpec(i)}
                  aria-label="Supprimer la caractéristique"
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addSpec} className="mt-2 text-sm underline">
            + Ajouter une caractéristique
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Inutile d'ajouter la marque, les tailles ou les couleurs : elles sont déjà affichées.
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            checked={form.isPublished}
            onChange={handleChange}
          />
          Produit publié (visible sur la boutique)
        </label>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleChange}
            />
            Mettre en avant sur la page d&apos;accueil
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            L&apos;accueil affiche 4 produits mis en avant au maximum.
          </p>
        </div>
      </div>

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