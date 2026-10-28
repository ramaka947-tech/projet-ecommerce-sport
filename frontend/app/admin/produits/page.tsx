'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getAdminProducts, deleteProduct, getCategories, updateProduct } from '@/lib/api';
import Link from 'next/link';
import { Pencil, Trash2, Search, Loader2, ImageIcon, ChevronLeft, ChevronRight, Check, Minus, Package, AlertCircle, Tag } from 'lucide-react';
import ProductImportExport from './product-import-export';
import { useCurrency } from '@/lib/currency';

const ITEMS_PER_PAGE = 12;

function Circle({ state, onClick, label }: { state: 'none' | 'some' | 'all'; onClick: () => void; label: string }) {
  const active = state !== 'none';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition md:size-5 ${
        active ? 'border-action bg-action text-white' : 'border-ink/30 bg-white hover:border-action'
      }`}
    >
      {state === 'all' && <Check size={12} strokeWidth={3} />}
      {state === 'some' && <Minus size={12} strokeWidth={3} />}
    </button>
  );
}

export default function AdminProductsPage() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const [prodData, catData] = await Promise.all([getAdminProducts(), getCategories()]);
    setProducts(prodData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit définitivement ?')) return;
    await deleteProduct(id);
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    load();
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isPublished: !currentStatus } : p)));
    try {
      await updateProduct(id, { isPublished: !currentStatus });
    } catch {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isPublished: currentStatus } : p)));
    }
  };

  const q = search.toLowerCase();
  const filtered = products.filter(
    (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
  );

  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const onPromo = products.filter(p => p.promoPrice).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasPagination = totalPages > 1;

  const selectedCount = filtered.filter((p) => selected.has(p.id)).length;
  const headerState: 'none' | 'some' | 'all' =
    selectedCount === 0 ? 'none' : selectedCount === filtered.length ? 'all' : 'some';

  const toggleAll = () => {
    setSelected(headerState === 'all' ? new Set() : new Set(filtered.map((p) => p.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const goToPage = (n: number) => {
    setPage(Math.min(Math.max(1, n), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSelected = async () => {
    const ids = filtered.filter((p) => selected.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;
    if (!confirm(`Supprimer définitivement ${ids.length} produit${ids.length > 1 ? 's' : ''} ?`)) return;
    setDeleting(true);
    for (const id of ids) {
      try { await deleteProduct(id); } catch {}
    }
    setSelected(new Set());
    setDeleting(false);
    load();
  };

  return (
    <AdminGuard>
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink md:text-3xl">Produits</h1>
          <p className="mt-1 text-sm text-ink/60">Gérez vos produits, leurs informations et leur disponibilité.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:w-auto">
          <ProductImportExport categories={categories} onSuccess={load} />
          <Link href="/admin/produits/nouveau" className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-action px-5 text-center font-semibold text-white shadow-sm transition hover:bg-action-dark md:min-h-0 md:flex-none md:py-2.5">
            + Ajouter un produit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-3">
        <div className="col-span-2 flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm md:col-span-1 md:gap-4 md:p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink md:size-12">
            <Package size={20} className="md:hidden" />
            <Package size={24} className="hidden md:block" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink/50 md:text-sm">Total produits</p>
            <p className="text-xl font-bold text-ink md:text-2xl">{totalProducts}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm md:gap-4 md:p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action/10 text-action md:size-12">
            <AlertCircle size={20} className="md:hidden" />
            <AlertCircle size={24} className="hidden md:block" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink/50 md:text-sm">Rupture</p>
            <p className="text-xl font-bold text-action md:text-2xl">{outOfStock}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm md:gap-4 md:p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-info/10 text-info md:size-12">
            <Tag size={20} className="md:hidden" />
            <Tag size={24} className="hidden md:block" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink/50 md:text-sm">En promo</p>
            <p className="text-xl font-bold text-info md:text-2xl">{onPromo}</p>
          </div>
        </div>
      </div>

      {/* Barre recherche + sélection */}
      <div className="flex flex-col gap-3 rounded-t-2xl border border-b-0 border-line bg-white p-3 md:flex-row md:items-center md:justify-between md:p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
          <span>{filtered.length} produit{filtered.length > 1 ? 's' : ''}</span>
          {selectedCount > 0 && (
            <>
              <span className="text-action">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-action px-3 text-xs font-semibold text-white transition hover:bg-action-dark disabled:opacity-60 md:min-h-0 md:py-1.5"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </>
          )}
        </div>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-line bg-canvas/30 pl-9 pr-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2 md:text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-b-2xl border border-line bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12 text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-ink/50">Aucun produit trouvé.</div>
        ) : (
          <>
            {/* Mobile : cartes */}
            <ul className="divide-y divide-line md:hidden">
              <li className="flex items-center gap-3 bg-canvas/30 px-3 py-2">
                <Circle state={headerState} onClick={toggleAll} label="Tout sélectionner" />
                <span className="text-xs font-semibold text-ink/60">Tout sélectionner</span>
              </li>
              {paginatedProducts.map((p) => {
                const isSel = selected.has(p.id);
                return (
                  <li key={p.id} className={`p-3 ${isSel ? 'bg-action-soft/40' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Circle state={isSel ? 'all' : 'none'} onClick={() => toggleOne(p.id)} label={`Sélectionner ${p.name}`} />
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-ink/20" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                        <p className="truncate text-xs text-ink/50">{p.category?.name} · {p.sku}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-ink">{formatPrice(p.price)}</span>
                          {p.stock === 0 ? (
                            <span className="rounded bg-action-soft px-1.5 py-0.5 text-[10px] font-bold text-action">Rupture</span>
                          ) : (
                            <span className={`text-xs font-medium ${p.stock <= 5 ? 'text-amber-600' : 'text-ink/60'}`}>Stock {p.stock}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                      <button onClick={() => handleToggle(p.id, p.isPublished)} className="flex min-h-10 items-center gap-2">
                        <div className={`relative h-5 w-9 rounded-full transition-colors ${p.isPublished ? 'bg-action' : 'bg-line'}`}>
                          <div className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${p.isPublished ? 'left-[18px]' : 'left-0.5'}`} />
                        </div>
                        <span className={`text-xs font-medium ${p.isPublished ? 'text-ink/70' : 'text-ink/40'}`}>{p.isPublished ? 'Activé' : 'Désactivé'}</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/admin/produits/${p.id}`} aria-label="Modifier" className="flex size-10 items-center justify-center rounded-lg bg-canvas text-ink/60 transition hover:bg-line hover:text-ink">
                          <Pencil size={16} />
                        </Link>
                        <button onClick={() => handleDelete(p.id)} aria-label="Supprimer" className="flex size-10 items-center justify-center rounded-lg bg-action-soft text-action transition hover:bg-action hover:text-white">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop : tableau */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/50 text-xs uppercase tracking-wider text-ink/60">
                    <th className="w-10 py-4 pl-6 pr-2"><Circle state={headerState} onClick={toggleAll} label="Tout sélectionner" /></th>
                    <th className="px-4 py-4 font-semibold">Produit</th>
                    <th className="px-6 py-4 font-semibold">SKU</th>
                    <th className="px-6 py-4 font-semibold">Prix</th>
                    <th className="px-6 py-4 font-semibold">Stock</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paginatedProducts.map((p) => {
                    const isSel = selected.has(p.id);
                    return (
                      <tr key={p.id} className={`transition ${isSel ? 'bg-action-soft/40' : 'hover:bg-canvas/30'}`}>
                        <td className="py-4 pl-6 pr-2"><Circle state={isSel ? 'all' : 'none'} onClick={() => toggleOne(p.id)} label={`Sélectionner ${p.name}`} /></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas">
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.name} className="size-full object-cover" />
                              ) : (
                                <ImageIcon size={28} className="text-ink/20" />
                              )}
                            </div>
                            <div>
                              <p className="text-base font-bold text-ink">{p.name}</p>
                              <p className="text-xs text-ink/50">{p.category?.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink/70">{p.sku}</td>
                        <td className="px-6 py-4 font-medium text-ink">{formatPrice(p.price)}</td>
                        <td className="px-6 py-4">
                          {p.stock === 0 ? (
                            <span className="rounded-md bg-action-soft px-2.5 py-1 text-xs font-bold text-action">Rupture</span>
                          ) : (
                            <span className={`text-sm font-medium ${p.stock <= 5 ? 'text-amber-600' : 'text-ink'}`}>{p.stock}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggle(p.id, p.isPublished)} className="group flex items-center gap-2 focus:outline-none">
                            <div className={`relative h-4 w-8 rounded-full transition-colors ${p.isPublished ? 'bg-action' : 'bg-line group-hover:bg-ink/20'}`}>
                              <div className={`absolute top-0.5 size-3 rounded-full bg-white transition-transform ${p.isPublished ? 'left-[18px]' : 'left-0.5'}`} />
                            </div>
                            <span className={`text-xs font-medium ${p.isPublished ? 'text-ink/70' : 'text-ink/40'}`}>{p.isPublished ? 'Activé' : 'Désactivé'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/produits/${p.id}`} className="rounded-lg bg-canvas p-2 text-ink/50 transition hover:bg-line hover:text-ink"><Pencil size={16} /></Link>
                            <button onClick={() => handleDelete(p.id)} className="rounded-lg bg-action-soft p-2 text-action transition hover:bg-action hover:text-white"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {hasPagination && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-4">
          <span className="text-xs text-ink/50 md:text-sm">Page {currentPage} sur {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-line px-3 text-sm font-medium hover:bg-canvas disabled:opacity-30 md:min-h-0 md:flex-none md:py-2">
              <ChevronLeft size={16} /> Précédent
            </button>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-line px-3 text-sm font-medium hover:bg-canvas disabled:opacity-30 md:min-h-0 md:flex-none md:py-2">
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}