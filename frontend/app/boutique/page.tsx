'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getProducts, getCategories } from '@/lib/api';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';

/* ---------- Carte produit ---------- */
function ProductCard({
  product,
  onAddToCart,
}: {
  product: any;
  onAddToCart: (product: any) => void;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const images: string[] = product.images?.filter(Boolean) ?? [];
  const [idx, setIdx] = useState(0);

  const isFav = isFavorite(product.id);
  const hasPromo = !!product.promoPrice;
  const discount = hasPromo
    ? Math.round((1 - product.promoPrice / product.price) * 100)
    : 0;

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function go(e: React.MouseEvent, dir: number) {
    stop(e);
    setIdx((i) => (i + dir + images.length) % images.length);
  }

  const reveal =
    'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity duration-200';

  const iconBtn =
    'w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition-colors';

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
        {images.length > 0 ? (
          images.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={product.name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                i === idx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.16-5.16a2.25 2.25 0 013.18 0l5.16 5.16m-1.5-1.5l1.41-1.41a2.25 2.25 0 013.18 0l2.66 2.66M3.75 19.5h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
            <span className="text-xs">Aucune image</span>
          </div>
        )}

        {hasPromo && (
          <span className="absolute top-3 left-3 z-20 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            -{discount}%
          </span>
        )}

        <div className={`absolute top-3 right-3 z-20 flex flex-col gap-2 ${reveal}`}>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              toggleFavorite(product);
            }}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={iconBtn}
          >
            <svg
              className={`w-5 h-5 ${isFav ? 'text-red-500' : ''}`}
              fill={isFav ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onAddToCart(product);
            }}
            aria-label="Ajouter au panier"
            className={iconBtn}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => go(e, -1)}
              aria-label="Image précédente"
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition-colors ${reveal}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => go(e, 1)}
              aria-label="Image suivante"
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition-colors ${reveal}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Voir l'image ${i + 1}`}
                  onClick={(e) => {
                    stop(e);
                    setIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all shadow ${
                    i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-[11px] uppercase tracking-wider text-gray-400">
          {product.category?.name || 'Sans catégorie'}
        </p>

        <h3 className="mt-1 font-semibold text-gray-900 leading-snug line-clamp-2">
          <Link
            href={`/produit/${product.id}`}
            className="after:absolute after:inset-0 after:z-10"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto pt-3 flex items-baseline gap-2">
          {hasPromo ? (
            <>
              <span className="text-lg font-bold text-red-600">
                {Number(product.promoPrice).toLocaleString('fr-FR')} €
              </span>
              <span className="text-sm text-gray-400 line-through">
                {Number(product.price).toLocaleString('fr-FR')} €
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {Number(product.price).toLocaleString('fr-FR')} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
function BoutiqueContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [cartProduct, setCartProduct] = useState<any | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const categoryId = searchParams.get('categoryId') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'recent';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const onSale = searchParams.get('onSale') || '';
  const page = Number(searchParams.get('page') || '1');

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Tout changement de filtre renvoie à la page 1
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
  }, []);

  useEffect(() => {
    getProducts({
      categoryId, search, sort, minPrice, maxPrice, onSale,
      page: String(page),
      limit: '12',
      paginated: 'true',
    }).then((data: any) => {
      setProducts(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    });
  }, [categoryId, search, sort, minPrice, maxPrice, onSale, page]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          <div className="lg:sticky lg:top-24 self-start">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full mb-4 border rounded-lg py-2 text-sm font-medium bg-white"
            >
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>

            <aside
              className={`${
                showFilters ? 'block' : 'hidden'
              } lg:block bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100`}
            >
              <div className="p-5">
                <h3 className="font-bold text-sm mb-3">Catégories</h3>
                <ul className="space-y-1.5 text-sm">
                  <li>
                    <button
                      onClick={() => setFilter('categoryId', '')}
                      className={`w-full text-left hover:text-yellow-600 ${
                        !categoryId ? 'font-semibold text-yellow-600' : 'text-gray-700'
                      }`}
                    >
                      Toutes les catégories
                    </button>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => setFilter('categoryId', c.id)}
                        className={`w-full text-left hover:text-yellow-600 ${
                          categoryId === c.id
                            ? 'font-semibold text-yellow-600'
                            : 'text-gray-700'
                        }`}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-sm mb-3">Prix (€)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setFilter('minPrice', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <span className="text-gray-300">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setFilter('maxPrice', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="p-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onSale === 'true'}
                    onChange={(e) =>
                      setFilter('onSale', e.target.checked ? 'true' : '')
                    }
                    className="accent-yellow-500"
                  />
                  En promotion uniquement
                </label>
              </div>

              <div className="p-5">
                <button
                  onClick={() => router.replace(pathname, { scroll: false })}
                  className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </aside>
          </div>

          <div>
            <div className="flex flex-wrap justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-extrabold">Boutique</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {total} produit{total > 1 ? 's' : ''}
                </p>
              </div>

              <select
                value={sort}
                onChange={(e) => setFilter('sort', e.target.value)}
                className="border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="recent">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <p className="text-gray-500">
                  Aucun produit ne correspond à votre recherche.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={setCartProduct}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center flex-wrap gap-2 mt-12">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed bg-white"
                    >
                      ← Précédent
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-4 py-2 border rounded-lg text-sm ${
                          p === page
                            ? 'bg-gray-900 text-white'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed bg-white"
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

      {cartProduct && (
        <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} />
      )}
    </main>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={null}>
      <BoutiqueContent />
    </Suspense>
  );
}