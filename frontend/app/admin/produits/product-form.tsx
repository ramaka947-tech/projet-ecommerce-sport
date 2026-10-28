'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  createProduct, updateProduct, uploadImage, getSizes, getColors, getBrands,
} from '@/lib/api';
import { compareSizes, sizeGroupOf } from '@/lib/sizes';
import {
  X, Check, ImagePlus, Tag, List, Info, Percent,
  Settings2, Trash2, UploadCloud
} from 'lucide-react';

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

  const groups = useMemo(
    () => Array.from(new Set(availableSizes.map(sizeGroupOf))),
    [availableSizes],
  );

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
    setForm((f) => ({
      ...f,
      sizes: f.sizes.filter((name: string) =>
        availableSizes.some((s) => s.name === name && sizeGroupOf(s) === g),
      ),
    }));
  };

  const toggleSize = (name: string) => setForm((f) => ({
    ...f,
    sizes: f.sizes.includes(name) ? f.sizes.filter((s: string) => s !== name) : [...f.sizes, name],
  }));

  const toggleColor = (name: string) => setForm((f) => ({
    ...f,
    colors: f.colors.includes(name) ? f.colors.filter((c: string) => c !== name) : [...f.colors, name],
  }));

  const toggleBrand = (name: string) => setForm((f) => ({
    ...f,
    brands: f.brands.includes(name) ? f.brands.filter((b: string) => b !== name) : [...f.brands, name],
  }));

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

  const updateSpec = (i: number, patch: Partial<Spec>) =>
    setSpecs((list) => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSpec = () => setSpecs((list) => [...list, { label: '', value: '', summary: false }]);
  const removeSpec = (i: number) => setSpecs((list) => list.filter((_, idx) => idx !== i));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value });
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

    const extras: Record<string, any> = {
      shortDescription: shortDescription.trim(),
      highlights: highlightsText.split('\n').map((s) => s.trim()).filter(Boolean),
      specs: specs.filter((s) => s.label.trim() && s.value.trim()).map((s) => ({ label: s.label.trim(), value: s.value.trim(), summary: !!s.summary })),
    };
    Object.entries(extras).forEach(([key, value]) => {
      const filled = Array.isArray(value) ? value.length > 0 : !!value;
      if (filled) payload[key] = value;
      else if (isEdit && key in product) payload[key] = Array.isArray(value) ? [] : null;
    });

    try {
      if (isEdit) await updateProduct(product.id, payload);
      else await createProduct(payload);
      router.push('/admin/produits');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const inputCls = 'min-h-11 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink transition-colors focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 md:min-h-0 md:text-sm';
  const labelCls = 'mb-1.5 block text-sm font-semibold text-ink';

  return (
    <form onSubmit={handleSubmit}>
      {/* Barre d'actions */}
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink md:text-2xl">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h1>
          <p className="mt-1 text-sm text-ink/60">Modifiez les informations du produit ci-dessous.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:w-auto">
          <Link href="/admin/produits" className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-line px-5 text-center font-semibold text-ink transition hover:bg-canvas md:min-h-0 md:flex-none md:py-2.5">
            Annuler
          </Link>
          <button type="submit" disabled={loading} className="min-h-11 flex-1 rounded-lg bg-ink px-5 font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50 md:min-h-0 md:flex-none md:py-2.5">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 md:gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* COLONNE GAUCHE */}
        <div className="min-w-0 space-y-4 md:space-y-6">
          {/* Infos générales */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-3 md:mb-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-action text-white"><Info size={18} /></div>
              <h2 className="text-base font-bold text-ink md:text-lg">Informations générales</h2>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="p_name" className={labelCls}>Nom du produit *</label>
                  <input id="p_name" name="name" required value={form.name} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="p_sku" className={labelCls}>SKU *</label>
                  <input id="p_sku" name="sku" required value={form.sku} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="p_price" className={labelCls}>Prix (FCFA) *</label>
                  <input id="p_price" name="price" type="number" inputMode="numeric" required value={form.price} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="p_stock" className={labelCls}>Stock *</label>
                  <input id="p_stock" name="stock" type="number" inputMode="numeric" required value={form.stock} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="p_cat" className={labelCls}>Catégorie *</label>
                  <select id="p_cat" name="categoryId" required value={form.categoryId} onChange={handleChange} className={inputCls}>
                    <option value="">-- Choisir --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Marques (optionnel)</label>
                  <div className="flex min-h-11 flex-wrap gap-2 rounded-lg border border-line bg-canvas/30 p-1.5">
                    {form.brands.map((b: string) => (
                      <span key={b} className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-xs font-medium">
                        {b} <button type="button" onClick={() => toggleBrand(b)} className="hover:text-action"><X size={12} /></button>
                      </span>
                    ))}
                    <select
                      onChange={(e) => { if (e.target.value) { toggleBrand(e.target.value); e.target.value = ""; } }}
                      className="min-w-[100px] flex-1 bg-transparent text-sm outline-none"
                    >
                      <option value="">+ Ajouter</option>
                      {availableBrands.filter(b => !form.brands.includes(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="p_short" className={labelCls}>Description courte (sous le prix)</label>
                <textarea id="p_short" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label htmlFor="p_desc" className={labelCls}>Description complète</label>
                <textarea id="p_desc" name="description" value={form.description} onChange={handleChange} rows={4} className={`${inputCls} resize-none`} />
              </div>
            </div>

            {/* Promotion */}
            <div className="mt-6 rounded-xl border border-action/20 bg-action/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-action"><Percent size={18} /> Promotion</div>
                <button type="button" onClick={() => setOnSale(!onSale)} className={`relative h-5 w-10 rounded-full transition-colors ${onSale ? 'bg-action' : 'bg-line'}`}>
                  <div className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${onSale ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {onSale && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="p_promo" className="mb-1.5 block text-xs font-semibold">Prix promo (FCFA)</label>
                    <input id="p_promo" name="promoPrice" type="number" inputMode="numeric" required value={form.promoPrice} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Détails */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-3 md:mb-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-action text-white"><List size={18} /></div>
              <h2 className="text-base font-bold text-ink md:text-lg">Détails du produit</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="p_high" className={labelCls}>Points forts (un par ligne)</label>
                <textarea id="p_high" value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Caractéristiques</label>
                {specs.map((s, i) => (
                  <div key={i} className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input value={s.label} onChange={(e) => updateSpec(i, { label: e.target.value })} placeholder="Libellé" className={`${inputCls} flex-1`} />
                    <input value={s.value} onChange={(e) => updateSpec(i, { value: e.target.value })} placeholder="Valeur" className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => removeSpec(i)} aria-label="Supprimer" className="flex size-10 shrink-0 items-center justify-center self-end rounded-lg text-action hover:bg-action-soft sm:self-auto">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSpec} className="mt-2 min-h-11 text-sm font-semibold text-action hover:underline md:min-h-0">
                  + Ajouter une caractéristique
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* COLONNE DROITE */}
        <div className="min-w-0 space-y-4 md:space-y-6">
          {/* Images */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-3 md:mb-5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-action text-white"><ImagePlus size={18} /></div>
              <h2 className="text-base font-bold text-ink md:text-lg">Images du produit</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {form.images.map((url: string) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
                  <img src={url} alt="" className="size-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)} aria-label="Supprimer l'image" className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-action text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}

              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line text-ink/50 transition hover:border-action hover:bg-action/5 hover:text-action">
                <UploadCloud size={24} className="mb-1 md:mb-2" />
                <span className="text-[10px] font-semibold md:text-xs">{uploading ? 'Chargement...' : 'Ajouter'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
          </section>

          {/* Tailles */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded bg-action/10 text-action"><Settings2 size={14} /></div>
              <h2 className="text-sm font-bold text-ink">Tailles disponibles</h2>
            </div>

            {groups.length > 1 && (
              <div className="mb-4 flex overflow-x-auto rounded-lg bg-canvas p-1">
                {groups.map((g) => (
                  <button key={g} type="button" onClick={() => changeSizeGroup(g)} className={`shrink-0 flex-1 rounded-md px-2 py-2 text-xs font-semibold transition ${sizeGroup === g ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'}`}>
                    {g}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {visibleSizes.map((s) => (
                <button key={s.id} type="button" onClick={() => toggleSize(s.name)} className={`flex size-11 items-center justify-center rounded-lg border text-sm font-medium transition md:size-10 ${form.sizes.includes(s.name) ? 'border-action bg-action/5 text-action' : 'border-line text-ink/70 hover:border-ink/30'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          </section>

          {/* Couleurs */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded bg-action/10 text-action"><Tag size={14} /></div>
              <h2 className="text-sm font-bold text-ink">Couleurs disponibles</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => (
                <button key={c.id} type="button" onClick={() => toggleColor(c.name)} className={`flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${form.colors.includes(c.name) ? 'border-action bg-action/5 text-action' : 'border-line text-ink/70 hover:border-ink/30'}`}>
                  <span className="size-3 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: c.hex || '#ccc' }} />
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          {/* Statut */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-6 items-center justify-center rounded bg-action/10 text-action"><Check size={14} /></div>
              <h2 className="text-sm font-bold text-ink">Statut du produit</h2>
            </div>

            <div className="space-y-4">
              <label className="flex min-h-11 cursor-pointer items-center justify-between md:min-h-0">
                <span className="text-sm font-medium">Visible dans la boutique</span>
                <div className={`relative h-5 w-10 rounded-full transition-colors ${form.isPublished ? 'bg-action' : 'bg-line'}`}>
                  <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="hidden" />
                  <div className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${form.isPublished ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </label>

              <label className="flex min-h-11 cursor-pointer items-center justify-between md:min-h-0">
                <span className="text-sm font-medium">Mettre en avant (Accueil)</span>
                <div className={`relative h-5 w-10 rounded-full transition-colors ${form.isFeatured ? 'bg-action' : 'bg-line'}`}>
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="hidden" />
                  <div className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${form.isFeatured ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
          </section>
        </div>
      </div>

      {error && <div className="mt-6 rounded-lg border border-action/20 bg-action-soft p-4 text-action">{error}</div>}
    </form>
  );
}