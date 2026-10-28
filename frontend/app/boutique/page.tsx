'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  getProducts, getCategories, getSettings,
  getSizes, getColors, getBrands,
} from '@/lib/api';
import { ArrowLeft, SlidersHorizontal, Grid3x3, List, X } from 'lucide-react';
import ProductCard from '@/components/product-card';
import ProductListItem from '@/components/product-list-item';

// ---------------------------------------------------------------------
// Tailles / couleurs / marques réellement utilisées par au moins un produit
// ---------------------------------------------------------------------
type UsedAttrs = { sizes: Set<string>; colors: Set<string>; brands: Set<string> };

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const csv = (v: string) => v.split(',').filter(Boolean);

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
  // Sur mobile/tablette : ouvre le panneau de filtres (feuille depuis le bas)
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

  // Panneau de filtres ouvert : on bloque le défilement de la page et Échap le ferme.
  useEffect(() => {
    if (!showFilters) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowFilters(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [showFilters]);

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
    const current = csv(searchParams.get(key) || '');
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFilter(key, updated.join(','));
  }

  function clearPrice() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function resetFilters() {
    router.replace(pathname, { scroll: false });
  }

  function setPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set('page', String(p));
    else params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    getCategories().then(setCategories).catch(() => { });
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

  // ---------- Filtres actifs (puces retirables, mobile/tablette) ----------
  const chips: { key: string; label: string; remove: () => void }[] = [];
  if (search) chips.push({ key: 'search', label: `Recherche : ${search}`, remove: () => setFilter('search', '') });
  if (categoryId)
    chips.push({
      key: 'cat',
      label: categories.find((c) => c.id === categoryId)?.name || 'Catégorie',
      remove: () => setFilter('categoryId', ''),
    });
  if (minPrice || maxPrice)
    chips.push({ key: 'price', label: `${minPrice || 0} – ${maxPrice || '∞'} FCFA`, remove: clearPrice });
  csv(sizesFilter).forEach((v) =>
    chips.push({ key: `s-${v}`, label: `Taille ${v}`, remove: () => toggleMultiFilter('sizes', v) }));
  csv(colorsFilter).forEach((v) =>
    chips.push({ key: `c-${v}`, label: v, remove: () => toggleMultiFilter('colors', v) }));
  csv(brandsFilter).forEach((v) =>
    chips.push({ key: `b-${v}`, label: v, remove: () => toggleMultiFilter('brand', v) }));
  if (onSale === 'true') chips.push({ key: 'sale', label: 'En promotion', remove: () => setFilter('onSale', '') });

  const filterCount = chips.filter((c) => c.key !== 'search').length;

  // ---------- Contenu des filtres : partagé entre la colonne desktop et le panneau mobile ----------
  const filters = (
    <>
      <div className="p-5">
        <h3 className="font-bold text-sm mb-3">Catégories</h3>
        <ul className="space-y-1 lg:space-y-2 text-sm">
          <li>
            <button
              onClick={() => setFilter('categoryId', '')}
              className={`w-full text-left py-2 lg:py-0 transition ${!categoryId ? 'font-semibold text-action' : 'text-ink/70 hover:text-action'
                }`}
            >
              Toutes les catégories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setFilter('categoryId', c.id)}
                className={`w-full text-left py-2 lg:py-0 transition ${categoryId === c.id
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
          {/* text-base sur mobile : à moins de 16 px, iOS zoome la page au focus */}
          <input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            min={0}
            max={1000000000}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > 1000000000) return;
              setFilter('minPrice', e.target.value);
            }}
            className="w-full border border-line rounded-lg px-3 py-2.5 lg:py-2 text-base lg:text-sm focus:outline-none focus:border-action"
          />
          <span className="text-ink/30">–</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            min={0}
            max={1000000000}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > 1000000000) return;
              setFilter('maxPrice', e.target.value);
            }}
            className="w-full border border-line rounded-lg px-3 py-2.5 lg:py-2 text-base lg:text-sm focus:outline-none focus:border-action"
          />
        </div>
      </div>

      {/* Tailles : seulement celles attribuées à un produit, alignées en grille */}
      {visibleSizes.length > 0 && (
        <div className="p-5">
          <h3 className="font-bold text-sm mb-3">Taille</h3>
          <div className="grid grid-cols-4 gap-2">
            {visibleSizes.map((s) => {
              const active = csv(sizesFilter).includes(s.name);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleMultiFilter('sizes', s.name)}
                  aria-pressed={active}
                  className={`px-2 py-2.5 lg:py-1.5 text-sm lg:text-xs text-center border rounded-lg transition ${active
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
              const active = csv(colorsFilter).includes(c.name);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleMultiFilter('colors', c.name)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 px-2.5 py-2.5 lg:py-1.5 text-sm lg:text-xs text-left border rounded-lg transition ${active
                    ? 'bg-action text-white border-action'
                    : 'border-line hover:border-action hover:text-action'
                    }`}
                >
                  <span
                    className="size-3.5 shrink-0 rounded-full border border-black/15"
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
              const active = csv(brandsFilter).includes(b.name);
              return (
                <button
                  key={b.id}
                  onClick={() => toggleMultiFilter('brand', b.name)}
                  aria-pressed={active}
                  className={`px-2.5 py-2.5 lg:py-1.5 text-sm lg:text-xs text-center border rounded-lg transition ${active
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
        <label className="flex items-center lg:items-start gap-3 lg:gap-2 text-sm cursor-pointer py-1 lg:py-0">
          <input
            type="checkbox"
            checked={onSale === 'true'}
            onChange={(e) => setFilter('onSale', e.target.checked ? 'true' : '')}
            className="accent-action size-5 lg:size-4 lg:mt-0.5 shrink-0"
          />
          <span>En promotion uniquement</span>
        </label>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-canvas text-ink pb-28 md:pb-0">
      {/* Hero boutique : bandeau compact sur mobile (image en fond), deux colonnes dès md */}
      <div className="max-w-375 mx-auto px-4 md:px-6 pt-4 md:pt-8">
        <section className="relative bg-ink text-white overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 md:min-h-80">
            <div className="relative z-20 flex flex-col justify-center px-5 md:px-14 lg:px-20 py-6 md:py-10">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight">
                TOUS NOS PRODUITS
                <br />
                <span className="text-action">AU MÊME ENDROIT</span>
              </h1>
              <p className="mt-3 text-[13px] md:text-base text-white/90 max-w-md line-clamp-3 md:line-clamp-none">
                Équipez-vous avec le meilleur matériel de sport. Des marques de qualité,
                des prix compétitifs et une livraison rapide partout au Sénégal.
              </p>
            </div>

            <div className="absolute inset-0 md:relative md:min-h-80">
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

              <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-linear-to-r from-ink to-transparent z-10" />
              {/* Mobile : voile sombre pour garder le texte lisible sur l'image */}
              <div className="md:hidden absolute inset-0 bg-ink/80 z-10" />
            </div>
          </div>
        </section>
      </div>

      <div className="max-w-375 mx-auto px-4 md:px-6 py-5 md:py-8">
        <button
          onClick={goBack}
          className="mb-4 md:mb-6 inline-flex items-center gap-2 h-11 md:h-auto rounded-lg border border-line bg-white px-3 md:py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          {/* Colonne filtres : desktop uniquement (sur mobile, voir le panneau en bas de page) */}
          <div className="hidden lg:block lg:sticky lg:top-24 self-start">
            <aside className="bg-white rounded-2xl border border-line divide-y divide-line">
              <div className="p-5">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  Filtres
                </h3>
              </div>

              {filters}

              <div className="p-5">
                <button
                  onClick={resetFilters}
                  className="w-full text-sm font-semibold text-action border border-action/40 rounded-lg py-2 hover:bg-action hover:text-white transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </aside>
          </div>

          {/* Contenu principal */}
          <div className="min-w-0">
            <div className="flex flex-wrap justify-between items-end mb-4 md:mb-6 gap-3 md:gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">Boutique</h1>
                <p className="text-sm text-ink/60 mt-1">
                  {loading
                    ? 'Chargement…'
                    : `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden relative inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-line bg-white text-sm font-semibold shrink-0 active:bg-canvas"
                >
                  <SlidersHorizontal size={16} />
                  Filtres
                  {filterCount > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-action text-white text-[11px] font-bold flex items-center justify-center">
                      {filterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                  aria-label="Trier les produits"
                  className="flex-1 min-w-0 md:flex-none h-11 md:h-auto border border-line rounded-xl md:rounded-lg px-3 md:py-2 text-base md:text-sm bg-white focus:outline-none focus:border-action"
                >
                  <option value="recent">Trier par : Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>

                <div className="flex border border-line rounded-xl md:rounded-lg overflow-hidden bg-white shrink-0">
                  <button
                    onClick={() => changeView('grid')}
                    className={`p-3 md:p-2 transition ${view === 'grid' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-canvas'}`}
                    aria-label="Vue grille"
                    aria-pressed={view === 'grid'}
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => changeView('list')}
                    className={`p-3 md:p-2 transition ${view === 'list' ? 'bg-ink text-white' : 'text-ink/60 hover:bg-canvas'}`}
                    aria-label="Vue liste"
                    aria-pressed={view === 'list'}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filtres actifs : défilent horizontalement, chacun se retire d'un tap (mobile/tablette) */}
            {chips.length > 0 && (
              <div className="lg:hidden -mx-4 px-4 md:mx-0 md:px-0 mb-4 flex gap-2 overflow-x-auto md:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {chips.map((c) => (
                  <button
                    key={c.key}
                    onClick={c.remove}
                    aria-label={`Retirer le filtre ${c.label}`}
                    className="shrink-0 inline-flex items-center gap-1.5 h-9 pl-3 pr-2.5 rounded-full border border-line bg-white text-xs font-medium whitespace-nowrap active:bg-canvas"
                  >
                    {c.label}
                    <X size={14} className="text-ink/50" />
                  </button>
                ))}
                {chips.length > 1 && (
                  <button
                    onClick={resetFilters}
                    className="shrink-0 h-9 px-3 text-xs font-semibold text-action whitespace-nowrap"
                  >
                    Tout effacer
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <ProductsSkeleton view={view} />
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-line p-8 md:p-16 text-center">
                <p className="text-ink/60">
                  Aucun produit ne correspond à votre recherche.
                </p>
                {filterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="mt-4 inline-flex items-center h-11 px-5 rounded-full bg-action text-white text-sm font-semibold"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                {view === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5 md:gap-x-6 md:gap-y-8">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 md:gap-4">
                    {products.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex justify-center items-center flex-wrap gap-2 mt-8 md:mt-12">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="h-11 md:h-auto px-4 md:py-2 border border-line rounded-lg text-sm bg-white hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Précédent
                    </button>

                    {/* Mobile : indicateur compact au lieu de tous les numéros de page */}
                    <span className="md:hidden px-2 text-sm text-ink/70" aria-live="polite">
                      Page {page} / {totalPages}
                    </span>

                    <div className="hidden md:flex flex-wrap gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          aria-current={p === page ? 'page' : undefined}
                          className={`px-4 py-2 border rounded-lg text-sm transition ${p === page
                            ? 'bg-action text-white border-action'
                            : 'bg-white border-line hover:bg-canvas'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="h-11 md:h-auto px-4 md:py-2 border border-line rounded-lg text-sm bg-white hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* Panneau de filtres (mobile/tablette) : feuille qui monte du bas, bouton toujours visible */}
      {showFilters && (
        <div className="fixed inset-0 z-60 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowFilters(false)} />

          <div className="absolute inset-x-0 bottom-0 flex flex-col max-h-[88dvh] bg-white rounded-t-3xl overflow-hidden">
            <div className="shrink-0 flex items-center justify-between pl-5 pr-2 h-14 border-b border-line">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <SlidersHorizontal size={18} />
                Filtres
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                aria-label="Fermer les filtres"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-canvas"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-line">
              {filters}
            </div>

            <div className="shrink-0 flex gap-3 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white">
              <button
                onClick={resetFilters}
                disabled={filterCount === 0}
                className="flex-1 h-12 rounded-xl border border-line text-sm font-semibold disabled:opacity-40"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-2 h-12 rounded-xl bg-action text-white text-sm font-semibold active:scale-[0.99]"
              >
                {loading ? 'Voir les produits' : `Voir ${total} produit${total > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProductsSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-3 md:gap-4" aria-busy="true" aria-label="Chargement des produits">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse"
          >
            <div className="w-36 sm:w-48 shrink-0 aspect-4/5 bg-gray-200" />
            <div className="flex-1 p-4 md:p-6 space-y-3">
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5 md:gap-x-6 md:gap-y-8"
      aria-busy="true"
      aria-label="Chargement des produits"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse"
        >
          <div className="aspect-4/5 bg-gray-200" />
          <div className="p-3 md:p-4 space-y-3">
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