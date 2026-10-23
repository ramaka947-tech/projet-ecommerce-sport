'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getAdminProducts, deleteProduct, getCategories, updateProduct } from '@/lib/api';
import Link from 'next/link';
import { Pencil, Trash2, Search, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, Check, Minus, Package, AlertCircle, Tag } from 'lucide-react';
import ProductImportExport from './product-import-export';
import { useCurrency } from '@/lib/currency';

const ITEMS_PER_PAGE = 12;

// Cercle de sélection réutilisable
function Circle({ state, onClick, label }: { state: 'none' | 'some' | 'all'; onClick: () => void; label: string }) {
  const active = state !== 'none';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
        active ? 'bg-action border-action text-white' : 'border-ink/30 hover:border-action bg-white'
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
    const [prodData, catData] = await Promise.all([
      getAdminProducts(),
      getCategories(),
    ]);
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

  // --- STATISTIQUES RAPIDES ---
  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const onPromo = products.filter(p => p.promoPrice).length;

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasPagination = totalPages > 1;

  // --- SÉLECTION ---
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">Produits</h1>
          <p className="text-sm text-ink/60 mt-1">Gérez vos produits, leurs informations et leur disponibilité.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <ProductImportExport categories={categories} onSuccess={load} />
          <Link href="/admin/produits/nouveau" className="flex-1 md:flex-none text-center bg-action text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-action-dark transition shadow-sm">
            + Ajouter un produit
          </Link>
        </div>
      </div>

      {/* --- WIDGETS STATISTIQUES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ink/5 text-ink flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink/50">Total produits</p>
            <p className="text-2xl font-bold text-ink">{totalProducts}</p>
          </div>
        </div>
        
        <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-action/10 text-action flex items-center justify-center shrink-0">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink/50">Produits en rupture</p>
            <p className="text-2xl font-bold text-action">{outOfStock}</p>
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink/50">En promotion</p>
            <p className="text-2xl font-bold text-info">{onPromo}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-t-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b-0">
        <div className="flex items-center gap-4 text-sm font-semibold text-ink">
          <span>{filtered.length} produit{filtered.length > 1 ? 's' : ''}</span>
          {selectedCount > 0 && (
            <>
              <span className="text-action">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 bg-action text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-action-dark transition disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Suppression...' : 'Supprimer la sélection'}
              </button>
            </>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-action bg-canvas/30"
          />
        </div>
      </div>

      <div className={`bg-white border border-line shadow-sm overflow-hidden rounded-b-2xl`}>
        {loading ? (
          <div className="p-12 flex justify-center text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-ink/50">Aucun produit trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas/50 text-ink/60 text-xs uppercase tracking-wider border-b border-line">
                  <th className="pl-6 pr-2 py-4 w-10">
                    <Circle state={headerState} onClick={toggleAll} label="Tout sélectionner" />
                  </th>
                  <th className="px-4 py-4 font-semibold">Produit</th>
                  <th className="px-6 py-4 font-semibold">SKU</th>
                  <th className="px-6 py-4 font-semibold">Prix</th>
                  <th className="px-6 py-4 font-semibold">Stock</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedProducts.map((p) => {
                  const isSel = selected.has(p.id);
                  return (
                    <tr key={p.id} className={`transition ${isSel ? 'bg-action-soft/40' : 'hover:bg-canvas/30'}`}>
                      <td className="pl-6 pr-2 py-4">
                        <Circle state={isSel ? 'all' : 'none'} onClick={() => toggleOne(p.id)} label={`Sélectionner ${p.name}`} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl bg-canvas border border-line shrink-0 overflow-hidden flex items-center justify-center">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={28} className="text-ink/20" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-ink text-base">{p.name}</p>
                            <p className="text-xs text-ink/50">{p.category?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink/70">{p.sku}</td>
                      <td className="px-6 py-4 font-medium text-ink">{formatPrice(p.price)}</td>
                      <td className="px-6 py-4">
                        {p.stock === 0 ? (
                          <span className="text-xs font-bold bg-action-soft text-action px-2.5 py-1 rounded-md">Rupture</span>
                        ) : (
                          <span className={`text-sm font-medium ${p.stock <= 5 ? 'text-amber-600' : 'text-ink'}`}>{p.stock}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggle(p.id, p.isPublished)} className="flex items-center gap-2 focus:outline-none group">
                          <div className={`w-8 h-4 rounded-full relative transition-colors ${p.isPublished ? 'bg-action' : 'bg-line group-hover:bg-ink/20'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${p.isPublished ? 'left-[18px]' : 'left-0.5'}`} />
                          </div>
                          <span className={`text-xs font-medium ${p.isPublished ? 'text-ink/70' : 'text-ink/40'}`}>{p.isPublished ? 'Activé' : 'Désactivé'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/produits/${p.id}`} className="p-2 text-ink/50 hover:text-ink bg-canvas hover:bg-line rounded-lg transition"><Pencil size={16} /></Link>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-action bg-action-soft hover:bg-action hover:text-white rounded-lg transition"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PAGINATION --- */}
      {hasPagination && (
        <div className="mt-4 bg-white border border-line rounded-2xl shadow-sm p-4 flex justify-between items-center">
          <span className="text-sm text-ink/50">Page {currentPage} sur {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-line rounded-lg hover:bg-canvas disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-line rounded-lg hover:bg-canvas disabled:opacity-30"
            >
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}