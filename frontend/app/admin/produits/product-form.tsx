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

  const isShoes = sizeGroup.toLowerCase().startsWith('chaussure');

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

  const inputCls = "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-action focus:outline-none focus:ring-2 focus:ring-action/20 transition-colors";

  return (
    <form onSubmit={handleSubmit}>
      
      {/* Barre d'actions en haut */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h1>
          <p className="text-sm text-ink/60 mt-1">Modifiez les informations du produit ci-dessous.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/admin/produits" className="flex-1 md:flex-none text-center px-5 py-2.5 rounded-lg border border-line text-ink font-semibold hover:bg-canvas transition">
            Annuler
          </Link>
          <button type="submit" disabled={loading} className="flex-1 md:flex-none bg-ink text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-ink/90 transition disabled:opacity-50">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        
        {/* COLONNE GAUCHE */}
        <div className="space-y-6">
          
          {/* Informations générales */}
          <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
              <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><Info size={18} /></div>
              <h2 className="text-lg font-bold text-ink">Informations générales</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Nom du produit *</label>
                  <input name="name" required value={form.name} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">SKU *</label>
                  <input name="sku" required value={form.sku} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Prix (FCFA) *</label>
                  <input name="price" type="number" required value={form.price} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Stock *</label>
                  <input name="stock" type="number" required value={form.stock} onChange={handleChange} className={inputCls} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Catégorie *</label>
                  <select name="categoryId" required value={form.categoryId} onChange={handleChange} className={inputCls}>
                    <option value="">-- Choisir --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Marques (optionnel)</label>
                  <div className="flex flex-wrap gap-2 border border-line rounded-lg p-1.5 bg-canvas/30 min-h-[46px]">
                    {form.brands.map((b: string) => (
                      <span key={b} className="inline-flex items-center gap-1 bg-white border border-line rounded-md px-2 py-1 text-xs font-medium">
                        {b} <button type="button" onClick={() => toggleBrand(b)} className="hover:text-action"><X size={12} /></button>
                      </span>
                    ))}
                    <select 
                      onChange={(e) => { if(e.target.value) { toggleBrand(e.target.value); e.target.value = ""; } }} 
                      className="bg-transparent text-sm outline-none flex-1 min-w-[100px]"
                    >
                      <option value="">+ Ajouter</option>
                      {availableBrands.filter(b => !form.brands.includes(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Description courte (sous le prix)</label>
                <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={2} className={inputCls} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description complète</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputCls} />
              </div>
            </div>

            {/* Promotion (dans le même bloc) */}
            <div className="mt-6 p-4 rounded-xl border border-action/20 bg-action/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-bold text-action"><Percent size={18} /> Promotion</div>
                <button type="button" onClick={() => setOnSale(!onSale)} className={`w-10 h-5 rounded-full relative transition-colors ${onSale ? 'bg-action' : 'bg-line'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${onSale ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {onSale && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Prix promo (FCFA)</label>
                    <input name="promoPrice" type="number" required value={form.promoPrice} onChange={handleChange} className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Points forts & caractéristiques */}
          <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
              <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><List size={18} /></div>
              <h2 className="text-lg font-bold text-ink">Détails du produit</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Points forts (un par ligne)</label>
                <textarea value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} rows={3} className={inputCls} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1.5">Caractéristiques</label>
                {specs.map((s, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <input value={s.label} onChange={(e) => updateSpec(i, { label: e.target.value })} placeholder="Libellé" className={`${inputCls} flex-1`} />
                    <input value={s.value} onChange={(e) => updateSpec(i, { value: e.target.value })} placeholder="Valeur" className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => removeSpec(i)} className="p-2 text-action hover:bg-action-soft rounded-lg"><Trash2 size={16}/></button>
                  </div>
                ))}
                <button type="button" onClick={addSpec} className="text-sm font-semibold text-action mt-2 hover:underline">+ Ajouter une caractéristique</button>
              </div>
            </div>
          </section>
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6">
          
          {/* Images */}
          <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-line pb-3">
              <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><ImagePlus size={18} /></div>
              <h2 className="text-lg font-bold text-ink">Images du produit</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {form.images.map((url: string) => (
                <div key={url} className="relative aspect-square rounded-xl border border-line overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-action text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-line rounded-xl hover:border-action hover:bg-action/5 cursor-pointer transition text-ink/50 hover:text-action">
                <UploadCloud size={24} className="mb-2" />
                <span className="text-xs font-semibold">{uploading ? 'Chargement...' : 'Ajouter'}</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
          </section>

          {/* Tailles */}
          <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded bg-action/10 text-action flex items-center justify-center"><Settings2 size={14} /></div>
              <h2 className="text-sm font-bold text-ink">Tailles disponibles</h2>
            </div>
            
            {groups.length > 1 && (
              <div className="flex bg-canvas rounded-lg p-1 mb-4">
                {groups.map((g) => (
                  <button key={g} type="button" onClick={() => changeSizeGroup(g)} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${sizeGroup === g ? 'bg-white shadow-sm text-ink' : 'text-ink/50 hover:text-ink'}`}>
                    {g}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {visibleSizes.map((s) => (
                <button key={s.id} type="button" onClick={() => toggleSize(s.name)} className={`w-10 h-10 rounded-lg border text-sm font-medium transition flex items-center justify-center ${form.sizes.includes(s.name) ? 'border-action bg-action/5 text-action' : 'border-line hover:border-ink/30 text-ink/70'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          </section>

          {/* Couleurs */}
          <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded bg-action/10 text-action flex items-center justify-center"><Tag size={14} /></div>
              <h2 className="text-sm font-bold text-ink">Couleurs disponibles</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => (
                <button key={c.id} type="button" onClick={() => toggleColor(c.name)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${form.colors.includes(c.name) ? 'border-action bg-action/5 text-action' : 'border-line hover:border-ink/30 text-ink/70'}`}>
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.hex || '#ccc' }} />
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          {/* Statut */}
          <section className="bg-white rounded-2xl border border-line p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded bg-action/10 text-action flex items-center justify-center"><Check size={14} /></div>
              <h2 className="text-sm font-bold text-ink">Statut du produit</h2>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Visible dans la boutique</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${form.isPublished ? 'bg-action' : 'bg-line'}`}>
                  <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="hidden" />
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isPublished ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </label>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Mettre en avant (Accueil)</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${form.isFeatured ? 'bg-action' : 'bg-line'}`}>
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="hidden" />
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.isFeatured ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </label>
            </div>
          </section>

        </div>
      </div>

      {error && <div className="mt-6 p-4 bg-action-soft border border-action/20 text-action rounded-lg">{error}</div>}
    </form>
  );
}