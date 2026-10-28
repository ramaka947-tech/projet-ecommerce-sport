'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Heart, ShoppingCart, ImageOff } from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';
import { useCurrency } from '@/lib/currency';

// Cloudinary : format et qualité automatiques, largeur limitée
function cld(src: string, w: number) {
  return src.includes('/upload/')
    ? src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`)
    : src;
}

// Image : 112 px sur mobile, 144 px dès sm, 192 px dès md
const SIZES = '(min-width: 768px) 192px, (min-width: 640px) 144px, 112px';

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
        <div className="relative w-28 sm:w-36 md:w-48 shrink-0 aspect-4/5 bg-gray-100 overflow-hidden">
          {image ? (
            <img
              src={cld(image, 320)}
              srcSet={`${cld(image, 240)} 240w, ${cld(image, 320)} 320w, ${cld(image, 480)} 480w`}
              sizes={SIZES}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover transition-transform duration-500 md:group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-gray-100 to-gray-200 text-gray-400">
              <ImageOff className="size-8" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-500">Aucune image</span>
            </div>
          )}

          {hasPromo && (
            <span className="absolute top-2 left-2 md:top-3 md:left-3 z-20 bg-red-600 text-white text-[11px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow">
              -{discount}%
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-1 flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 p-3 md:p-6 min-w-0">
          <div className="min-w-0">
            <p className="truncate text-[11px] uppercase tracking-wider text-gray-500">
              {product.category?.name || 'Sans catégorie'}
            </p>

            <h3 className="mt-0.5 md:mt-1 text-sm md:text-lg font-semibold text-gray-900 leading-snug line-clamp-2">
              <Link
                href={`/produit/${product.id}`}
                className="after:absolute after:inset-0 after:z-10"
              >
                {product.name}
              </Link>
            </h3>

            {/* Avis */}
            <div className="mt-1.5 md:mt-2 flex items-center gap-1.5 md:gap-2">
              {ratingCount > 0 ? (
                <>
                  <div className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`size-3 md:size-3.5 ${
                          i <= Math.round(rating)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm text-gray-600">
                    <span className="sr-only">Note : </span>
                    {Number(rating).toFixed(1)} ({ratingCount}
                    <span className="hidden sm:inline"> avis</span>)
                  </span>
                </>
              ) : (
                <span className="text-xs md:text-sm text-gray-500">Pas encore d'avis</span>
              )}
            </div>

            {/* Description : masquée sur mobile pour garder la ligne compacte */}
            {product.description && (
              <p className="hidden sm:block mt-2 text-sm text-gray-600 line-clamp-2 max-w-2xl">
                {product.description}
              </p>
            )}

            {outOfStock && (
              <span className="mt-2 md:mt-3 inline-block bg-gray-900 text-white text-[11px] md:text-xs font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full">
                Rupture de stock
              </span>
            )}
          </div>

          {/* Prix + actions */}
          <div className="mt-auto md:mt-0 flex md:flex-col items-end md:items-end justify-between md:justify-center gap-2 md:gap-3 shrink-0">
            <div className="min-w-0 flex flex-col md:items-end leading-tight">
              {hasPromo ? (
                <>
                  <span className="text-base md:text-xl font-bold text-red-600 whitespace-nowrap">
                    {formatPrice(product.promoPrice)}
                  </span>
                  <span className="text-xs md:text-sm text-gray-400 line-through whitespace-nowrap">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-base md:text-xl font-bold text-gray-900 whitespace-nowrap">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <div className="relative z-20 flex items-center gap-1 md:gap-2 -mr-1 -mb-1 md:m-0">
              {/* Favoris : zone tactile 44 px, pastille visuelle 36 px sur mobile */}
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  toggleFavorite(product);
                }}
                aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                aria-pressed={isFav}
                className="group/fav flex size-11 md:size-10 items-center justify-center"
              >
                <span className="flex size-9 md:size-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 md:group-hover/fav:bg-gray-900 md:group-hover/fav:text-white md:group-hover/fav:border-gray-900 transition-colors">
                  <Heart
                    className={`size-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                    strokeWidth={1.8}
                  />
                </span>
              </button>

              {/* Panier : icône seule sur mobile, libellé dès sm */}
              <button
                type="button"
                disabled={outOfStock}
                onClick={(e) => {
                  stop(e);
                  setShowModal(true);
                }}
                aria-label="Ajouter au panier"
                className="size-11 sm:size-auto sm:h-11 md:h-10 sm:px-4 rounded-full bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 active:bg-red-700 md:hover:bg-red-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ShoppingCart className="size-5 sm:size-4" strokeWidth={2} />
                <span className="hidden sm:inline">Ajouter</span>
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