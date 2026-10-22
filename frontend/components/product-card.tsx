'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';
import { useCurrency } from '@/lib/currency';

export default function ProductCard({ product }: { product: any }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatPrice } = useCurrency();
  const images: string[] = product.images?.filter(Boolean) ?? [];
  const [idx, setIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);

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

  function go(e: React.MouseEvent, dir: number) {
    stop(e);
    setIdx((i) => (i + dir + images.length) % images.length);
  }

  // Flèches + points : visibles au survol sur desktop, toujours sur mobile
  const reveal =
    'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity duration-200';

  const circleBtn =
    'flex items-center justify-center rounded-full bg-white/95 shadow-md text-gray-700 hover:bg-gray-900 hover:text-white transition-colors';

  return (
    <>
      <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Image */}
        <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
          {images.length > 0 ? (
            images.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={product.name}
                // La première image est chargée tout de suite, les autres aussi
                // pour éviter le flash au premier survol
                loading={i === 0 ? 'lazy' : 'eager'}
                className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-105 ${
                  i === idx ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ))
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
              <ImageOff className="w-10 h-10" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-500">Aucune image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 items-start">
            {hasPromo && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                -{discount}%
              </span>
            )}
            {outOfStock && (
              <span className="bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                Rupture de stock
              </span>
            )}
          </div>

          {/* Favoris : toujours visible */}
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              toggleFavorite(product);
            }}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className={`${circleBtn} absolute top-3 right-3 z-20 w-9 h-9`}
          >
            <Heart
              className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
              strokeWidth={1.8}
            />
          </button>

          {/* Flèches + points */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => go(e, -1)}
                aria-label="Image précédente"
                className={`${circleBtn} absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 ${reveal}`}
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={(e) => go(e, 1)}
                aria-label="Image suivante"
                className={`${circleBtn} absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 ${reveal}`}
              >
                <ChevronRight className="w-4 h-4" strokeWidth={2.2} />
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

        {/* Infos */}
        <div className="flex flex-col flex-1 p-4">
          <p className="text-[11px] uppercase tracking-wider text-gray-500">
            {product.category?.name || 'Sans catégorie'}
          </p>

          <h3 className="mt-1 font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.75rem]">
            <Link
              href={`/produit/${product.id}`}
              className="after:absolute after:inset-0 after:z-10"
            >
              {product.name}
            </Link>
          </h3>

          {/* Étoiles : hauteur réservée pour aligner toutes les cartes */}
          <div className="mt-1.5 h-4 flex items-center gap-1.5">
            {ratingCount > 0 ? (
              <>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i <= Math.round(rating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {rating} ({ratingCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Pas encore d'avis</span>
            )}
          </div>

          {/* Prix + panier toujours visible */}
          <div className="mt-auto pt-3 flex items-end justify-between gap-2">
            <div className="flex flex-col leading-tight">
              {hasPromo ? (
                <>
                  <span className="text-base font-bold text-red-600">
                    {formatPrice(product.promoPrice)}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-base font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={(e) => {
                stop(e);
                setShowModal(true);
              }}
              aria-label="Ajouter au panier"
              className="relative z-20 w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ShoppingCart className="w-5 h-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <AddToCartModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}