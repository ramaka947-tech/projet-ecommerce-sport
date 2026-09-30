'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getProducts, getCategories } from '@/lib/api';
import ProductCardImages from './product-card-images';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Les filtres sont dérivés de l'URL : source de vérité unique.
  const categoryId = searchParams.get('categoryId') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'recent';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const onSale = searchParams.get('onSale') || '';

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    getProducts({ categoryId, search, sort, minPrice, maxPrice, onSale }).then(setProducts);
  }, [categoryId, search, sort, minPrice, maxPrice, onSale]);

  return (
    <main className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Catalogue produits</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="border rounded px-3 py-2"
        />
        <select
          value={categoryId}
          onChange={(e) => setFilter('categoryId', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Prix min"
          value={minPrice}
          onChange={(e) => setFilter('minPrice', e.target.value)}
          className="border rounded px-3 py-2 w-28"
        />
        <input
          type="number"
          placeholder="Prix max"
          value={maxPrice}
          onChange={(e) => setFilter('maxPrice', e.target.value)}
          className="border rounded px-3 py-2 w-28"
        />
        <select
          value={sort}
          onChange={(e) => setFilter('sort', e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="recent">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>

        <label className="flex items-center gap-2 border rounded px-3 py-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={onSale === 'true'}
            onChange={(e) => setFilter('onSale', e.target.checked ? 'true' : '')}
          />
          En promo
        </label>

        <button
          onClick={() => router.replace(pathname, { scroll: false })}
          className="border rounded px-3 py-2 text-sm hover:bg-gray-100"
        >
          Réinitialiser
        </button>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">Aucun produit disponible.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/produit/${product.id}`}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition block"
            >
              <ProductCardImages images={product.images} alt={product.name} />
              <h2 className="font-semibold text-lg">{product.name}</h2>
              <p className="text-sm text-gray-500">{product.category?.name}</p>
              <div className="mt-2">
                {product.promoPrice ? (
                  <>
                    <span className="text-red-600 font-bold">{product.promoPrice} €</span>
                    <span className="text-gray-400 line-through ml-2">{product.price} €</span>
                  </>
                ) : (
                  <span className="font-bold">{product.price} €</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Stock : {product.stock}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}