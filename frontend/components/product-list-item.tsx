'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';
import { useCurrency } from '@/lib/currency';

export default function ProductListItem({ product }: { product: any }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatPrice } = useCurrency();
  const [showModal, setShowModal] = useState(false);

  const image: string | undefined = product.images?.filter(Boolean)?.[0];
  const isFav = isFavorite(product.id);
  const hasPromo = !!product.promoPrice;
  const discount = hasPromo
    ? Math.round((1 - product.promoPrice / product.price) * 100)
    : 0;
  const rating = product.ratingAverage || 0;
  const ratingCount = product.ratingCount || 0;
  const outOfStock = product.stock !== undefined && product.stock <= 0;

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <>
      <div className="group relative flex bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Image */}
        <div className="relative w-36 sm:w-48 shrink-0 aspect-[4/5] bg-gray-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
              <ImageOff className="w-8 h-8" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-500">Aucune image</span>
            </div>
          )}

          {hasPromo && (
            <span className="absolute top-3 left-3 z-20 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              -{discount}%
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 min-w-0">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">
              {product.category?.name || 'Sans catégorie'}
            </p>

            <h3 className="mt-1 text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
              <Link
                href={`/produit/${product.id}`}
                className="after:absolute after:inset-0 after:z-10"
              >
                {product.name}
              </Link>
            </h3>

            {/* Avis : texte gris foncé bien lisible */}
            <div className="mt-2 flex items-center gap-2">
              {ratingCount > 0 ? (
                <>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i <= Math.round(rating)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {rating} ({ratingCount} avis)
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">Pas encore d'avis</span>
              )}
            </div>

            {product.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2 max-w-2xl">
                {product.description}
              </p>
            )}

            {outOfStock && (
              <span className="mt-3 inline-block bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Rupture de stock
              </span>
            )}
          </div>

          {/* Prix + actions */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
            <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 leading-tight">
              {hasPromo ? (
                <>
                  <span className="text-xl font-bold text-red-600">
                    {formatPrice(product.promoPrice)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="relative z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  toggleFavorite(product);
                }}
                aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                  strokeWidth={1.8}
                />
              </button>

              <button
                type="button"
                disabled={outOfStock}
                onClick={(e) => {
                  stop(e);
                  setShowModal(true);
                }}
                className="h-10 px-4 rounded-full bg-red-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={2} />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <AddToCartModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}