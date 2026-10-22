'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  getProducts, getCategories, getSettings,
  getSizes, getColors, getBrands,
} from '@/lib/api';
import { ArrowLeft, SlidersHorizontal, Grid3x3, List } from 'lucide-react';
import ProductCard from '@/components/product-card';
import ProductListItem from '@/components/product-list-item';

// ---------------------------------------------------------------------
// Tailles / couleurs / marques réellement utilisées par au moins un produit
// ---------------------------------------------------------------------
type UsedAttrs = { sizes: Set<string>; colors: Set<string>; brands: Set<string> };

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

function collectUsed(products: any[]): UsedAttrs {
  const used: UsedAttrs = { sizes: new Set(), colors: new Set(), brands: new Set() };
  for (const p of products) {
    (p.sizes || []).forEach((v: string) => used.sizes.add(norm(v)));
    (p.colors || []).forEach((v: string) => used.colors.add(norm(v)));
    (p.brands || []).forEach((v: string) => used.brands.add(norm(v)));
  }
  return used;
}

// Pointures (38, 40...) d'abord, puis tailles en lettres (S, M, L...)
const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL'];
function sizeRank(name: string): [number, number] {
  const n = String(name).trim().toUpperCase();
  if (/^\d+([.,]\d+)?$/.test(n)) return [0, parseFloat(n.replace(',', '.'))];
  const i = LETTER_ORDER.indexOf(n);
  return [1, i === -1 ? 99 : i];
}
function sortSizeList(list: any[]) {
  return [...list].sort((a, b) => {
    const ra = sizeRank(a.name);
    const rb = sizeRank(b.name);
    return ra[0] - rb[0] || ra[1] - rb[1] || String(a.name).localeCompare(String(b.name));
  });
}

function BoutiqueContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [availableColors, setAvailableColors] = useState<any[]>([]);
  const [availableBrands, setAvailableBrands] = useState<any[]>([]);
  // null = en cours de chargement, 'error' = impossible de savoir (on affiche tout)
  const [used, setUsed] = useState<UsedAttrs | null | 'error'>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const categoryId = searchParams.get('categoryId') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'recent';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const onSale = searchParams.get('onSale') || '';
  const sizesFilter = searchParams.get('sizes') || '';
  const colorsFilter = searchParams.get('colors') || '';
  const brandsFilter = searchParams.get('brand') || '';
  const page = Number(searchParams.get('page') || '1');

  useEffect(() => {
    const saved = localStorage.getItem('boutique_view') as 'grid' | 'list' | null;
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);

  function changeView(v: 'grid' | 'list') {
    setView(v);
    localStorage.setItem('boutique_view', v);
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/');
  }

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleMultiFilter(key: 'sizes' | 'colors' | 'brand', value: string) {
    const current = (searchParams.get(key) || '').split(',').filter(Boolean);
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilter(key, updated.join(','));
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', String(p));
    else params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    getCategories().then(setCategories);
    getSettings().then(setSettings).catch(() => { });
    getSizes().then(setAvailableSizes).catch(() => { });
    getColors().then(setAvailableColors).catch(() => { });
    getBrands().then(setAvailableBrands).catch(() => { });

    // On regarde quels attributs sont vraiment attribués à des produits
    getProducts()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.items || [];
        setUsed(collectUsed(list));
      })
      .catch(() => setUsed('error'));
  }, []);

  // Listes affichées dans les filtres : seulement ce qui est utilisé
  const visibleSizes =
    used === null
      ? []
      : sortSizeList(
        used === 'error'
          ? availableSizes
          : availableSizes.filter((s) => used.sizes.has(norm(s.name))),
      );
  const visibleColors =
    used === null
      ? []
      : used === 'error'
        ? availableColors
        : availableColors.filter((c) => used.colors.has(norm(c.name)));
  const visibleBrands =
    used === null
      ? []
      : used === 'error'
        ? availableBrands
        : availableBrands.filter((b) => used.brands.has(norm(b.name)));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getProducts({
      categoryId,
      search,
      sort,
      minPrice,
      maxPrice,
      onSale,
      sizes: sizesFilter,
      colors: colorsFilter,
      brand: brandsFilter,
      page: String(page),
      limit: '12',
      paginated: 'true',
    })
      .then((data: any) => {
        if (cancelled) return;
        setProducts(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, search, sort, minPrice, maxPrice, onSale, sizesFilter, colorsFilter, brandsFilter, page]);

  const heroImage = settings.shop_hero_image
    ? settings.shop_hero_image.replace('/upload/', '/upload/q_100,w_2400/')
    : '';

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Hero boutique */}
      <div className="max-w-[1500px] mx-auto px-6 pt-6 md:pt-8">
        <section className="relative bg-ink text-white overflow-hidden rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[260px] md:min-h-[320px]">
            <div className="relative z-10 flex flex-col justify-center px-8 md:px-14 lg:px-20 py-8 md:py-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight">
                TOUS NOS PRODUITS
                <br />
                <span className="text-action">AU MÊME ENDROIT</span>
              </h1>
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-md">
                Équipez-vous avec le meilleur matériel de sport. Des marques de qualité,
                des prix compétitifs et une livraison rapide partout au Sénégal.
              </p>
            </div>

            <div className="relative md:h-auto h-64 md:min-h-[320px]">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt="Bannière boutique"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="eager"
                />
              ) : (
                <div className="absolute inset-0 bg-ink-soft" />
              )}

              <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink to-transparent z-10" />
              <div className="md:hidden absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink to-transparent z-10" />
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-8">
        <button
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar filtres */}
          <div className="lg:sticky lg:top-24 self-start">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full mb-4 border border-line rounded-lg py-2.5 text-sm font-semibold bg-white flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={16} />
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>

            <aside
              className={`${showFilters ? 'block' : 'hidden'
                } lg:block bg-white rounded-2xl border border-line divide-y divide-line`}
            >
              <div className="p-5">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  Filtres
                </h3>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-sm mb-3">Catégories</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <button
                      onClick={() => setFilter('categoryId', '')}
                      className={`w-full text-left transition ${!categoryId ? 'font-semibold text-action' : 'text-ink/70 hover:text-action'
                        }`}
                    >
                      Toutes les catégories
                    </button>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setFilter('categoryId', c.id)}
                        className={`w-full text-left transition ${categoryId === c.id
                          ? 'font-semibold text-action'
                          : 'text-ink/70 hover:text-action'
                          }`}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-sm mb-3">Prix (FCFA)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    min={0}
                    max={1000000000}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > 1000000000) return;
                      setFilter('minPrice', e.target.value);
                    }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-action"
                  />
                  <span className="text-ink/30">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    min={0}
                    max={1000000000}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (v > 1000000000) return;
                      setFilter('maxPrice', e.target.value);
                    }}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-action"
                  />
                </div>
              </div>

              {/* Tailles : seulement celles attribuées à un produit, alignées en grille */}
              {visibleSizes.length > 0 && (
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-3">Taille</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {visibleSizes.map((s) => {
                      const active = sizesFilter.split(',').includes(s.name);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleMultiFilter('sizes', s.name)}
                          className={`px-2 py-1.5 text-xs text-center border rounded-lg transition ${active
                            ? 'bg-action text-white border-action'
                            : 'border-line hover:border-action hover:text-action'
                            }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Couleurs : seulement celles attribuées à un produit, avec pastille */}
              {visibleColors.length > 0 && (
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-3">Couleur</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleColors.map((c) => {
                      const active = colorsFilter.split(',').includes(c.name);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleMultiFilter('colors', c.name)}
                          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs text-left border rounded-lg transition ${active
                            ? 'bg-action text-white border-action'
                            : 'border-line hover:border-action hover:text-action'
                            }`}
                        >
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/15"
                            style={{ backgroundColor: c.hex || '#E5E5E5' }}
                          />
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Marques : seulement celles attribuées à un produit */}
              {visibleBrands.length > 0 && (
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-3">Marque</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {visibleBrands.map((b) => {
                      const active = brandsFilter.split(',').includes(b.name);
                      return (
                        <button
                          key={b.id}
                          onClick={() => toggleMultiFilter('brand', b.name)}
                          className={`px-2.5 py-1.5 text-xs text-center border rounded-lg transition ${active
                            ? 'bg-action text-white border-action'
                            : 'border-line hover:border-action hover:text-action'
                            }`}
                        >
                          {b.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-5">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onSale === 'true'}
                    onChange={(e) => setFilter('onSale', e.target.checked ? 'true' : '')}
                    className="accent-action mt-0.5 shrink-0"
                  />
                  <span>En promotion uniquement</span>
                </label>
              </div>

              <div className="p-5">
                <button
                  onClick={() => router.replace(pathname, { scroll: false })}
                  className="w-full text-sm font-semibold text-action border border-action/40 rounded-lg py-2 hover:bg-action hover:text-white transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </aside>
          </div>

          {/* Contenu principal */}
          <div>
            <div className="flex flex-wrap justify-between items-end mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold">Boutique</h1>
                <p className="text-sm text-ink/60 mt-1">
                  {loading
                    ? 'Chargement…'
                    : `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  className="border border-line rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-action"
                >
                  <option value="recent">Trier par : Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>

                <div className="hidden md:flex border border-line rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => changeView('grid')}
                    className={`p-2 transition ${view === 'grid' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-canvas'}`}
                    aria-label="Vue grille"
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => changeView('list')}
                    className={`p-2 transition ${view === 'list' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-canvas'}`}
                    aria-label="Vue liste"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <ProductsSkeleton view={view} />
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-line p-16 text-center">
                <p className="text-ink/60">
                  Aucun produit ne correspond à votre recherche.
                </p>
              </div>
            ) : (
              <>
                {view === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {products.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex justify-center flex-wrap gap-2 mt-12">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-4 py-2 border border-line rounded-lg text-sm bg-white hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Précédent
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-4 py-2 border rounded-lg text-sm transition ${p === page
                          ? 'bg-action text-white border-action'
                          : 'bg-white border-line hover:bg-canvas'
                          }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-4 py-2 border border-line rounded-lg text-sm bg-white hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ProductsSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement des produits">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse"
          >
            <div className="w-36 sm:w-48 shrink-0 aspect-[4/5] bg-gray-200" />
            <div className="flex-1 p-6 space-y-3">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-1/2 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
              <div className="h-6 w-28 bg-gray-200 rounded mt-6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8"
      aria-busy="true"
      aria-label="Chargement des produits"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse"
        >
          <div className="aspect-[4/5] bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={null}>
      <BoutiqueContent />
    </Suspense>
  );
}