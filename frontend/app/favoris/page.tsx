'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';

export default function FavorisPage() {
  const { favorites, removeFavorite } = useFavorites();
  const [cartProduct, setCartProduct] = useState<any | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-extrabold">Mes favoris</h1>
        <p className="text-sm text-gray-500 mt-1">
          {favorites.length} produit{favorites.length > 1 ? 's' : ''}
        </p>

        {favorites.length === 0 ? (
          <div className="mt-8 bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500">Vous n'avez pas encore de favoris.</p>
            <Link
              href="/boutique"
              className="inline-block mt-4 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {favorites.map((p) => {
              const hasPromo = !!p.promoPrice;
              return (
                <div
                  key={p.id}
                  className="relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
                >
                  <div className="relative aspect-[4/5] bg-gray-100">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <button
                      onClick={() => removeFavorite(p.id)}
                      aria-label="Retirer des favoris"
                      className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-red-500 hover:bg-gray-900"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col flex-1 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">
                      {p.category?.name || 'Sans catégorie'}
                    </p>
                    <h3 className="mt-1 font-semibold text-gray-900 leading-snug line-clamp-2">
                      <Link
                        href={`/produit/${p.id}`}
                        className="after:absolute after:inset-0 after:z-10"
                      >
                        {p.name}
                      </Link>
                    </h3>

                    <div className="mt-auto pt-3 flex items-baseline gap-2">
                      <span className={`text-lg font-bold ${hasPromo ? 'text-red-600' : 'text-gray-900'}`}>
                        {Number(hasPromo ? p.promoPrice : p.price).toLocaleString('fr-FR')} €
                      </span>
                      {hasPromo && (
                        <span className="text-sm text-gray-400 line-through">
                          {Number(p.price).toLocaleString('fr-FR')} €
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setCartProduct(p)}
                      className="relative z-20 mt-3 w-full bg-gray-900 hover:bg-yellow-500 hover:text-black text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cartProduct && (
        <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} />
      )}
    </main>
  );
}