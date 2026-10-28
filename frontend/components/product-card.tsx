'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Heart, ShoppingCart, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';
import { useCurrency } from '@/lib/currency';

// Cloudinary : format et qualité automatiques, largeur limitée
function cld(src: string, w: number) {
  return src.includes('/upload/')
    ? src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`)
    : src;
}

const SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

export default function ProductCard({ product }: { product: any }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatPrice } = useCurrency();
  const images: string[] = product.images?.filter(Boolean) ?? [];
  const [idx, setIdx] = useState(0);
  const [warm, setWarm] = useState(false); // charge les images 2+ seulement après interaction
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
    setWarm(true);
    setIdx((i) => (i + dir + images.length) % images.length);
  }

  // Flèches : desktop/tablette seulement, visibles au survol sur lg
  const reveal =
    'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity duration-200';

  const circleBtn =
    'items-center justify-center rounded-full bg-white/95 shadow-md text-gray-700 hover:bg-gray-900 hover:text-white transition-colors';

  return (
    <>
      <div
        className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setWarm(true);
        }}
      >
        {/* Image */}
        <div className="relative aspect-4/5 bg-gray-100 overflow-hidden">
          {images.length > 0 ? (
            images.map((src, i) =>
              i === 0 || warm || i === idx ? (
                <img
                  key={src + i}
                  src={cld(src, 480)}
                  srcSet={`${cld(src, 320)} 320w, ${cld(src, 480)} 480w, ${cld(src, 720)} 720w`}
                  sizes={SIZES}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 size-full object-cover transition-[opacity,transform] duration-500 md:group-hover:scale-105 ${
                    i === idx ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ) : null
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-gray-100 to-gray-200 text-gray-400">
              <ImageOff className="size-10" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-500">Aucune image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-20 flex flex-col gap-1 md:gap-1.5 items-start">
            {hasPromo && (
              <span className="bg-red-600 text-white text-[11px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow">
                -{discount}%
              </span>
            )}
            {outOfStock && (
              <span className="bg-gray-900 text-white text-[11px] md:text-xs font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow">
                Rupture de stock
              </span>
            )}
          </div>

          {/* Favoris : zone tactile 44 px, pastille visuelle 36 px */}
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              toggleFavorite(product);
            }}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isFav}
            className="group/fav absolute top-1 right-1 md:top-3 md:right-3 z-20 flex size-11 md:size-9 items-center justify-center"
          >
            <span
              className={`flex size-9 ${circleBtn} md:group-hover/fav:bg-gray-900 md:group-hover/fav:text-white hover:bg-white hover:text-gray-700`}
            >
              <Heart
                className={`size-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`}
                strokeWidth={1.8}
              />
            </span>
          </button>

          {/* Flèches + points : masqués sur mobile (cibles trop petites, la carte mène à la fiche) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => go(e, -1)}
                aria-label="Image précédente"
                className={`${circleBtn} hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 size-8 ${reveal}`}
              >
                <ChevronLeft className="size-4" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={(e) => go(e, 1)}
                aria-label="Image suivante"
                className={`${circleBtn} hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 size-8 ${reveal}`}
              >
                <ChevronRight className="size-4" strokeWidth={2.2} />
              </button>

              <div className="hidden md:flex absolute bottom-3 left-1/2 -translate-x-1/2 z-20 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Voir l'image ${i + 1}`}
                    onClick={(e) => {
                      stop(e);
                      setWarm(true);
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
        <div className="flex flex-col flex-1 p-3 md:p-4">
          <p className="truncate text-[11px] uppercase tracking-wider text-gray-500">
            {product.category?.name || 'Sans catégorie'}
          </p>

          <h3 className="mt-1 text-sm md:text-base font-semibold text-gray-900 leading-snug line-clamp-2 min-h-10 md:min-h-11">
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
                <div className="flex gap-0.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i <= Math.round(rating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  <span className="sr-only">Note : </span>
                  {Number(rating).toFixed(1)} ({ratingCount})
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Pas encore d'avis</span>
            )}
          </div>

          {/* Prix + panier toujours visible */}
          <div className="mt-auto pt-2 md:pt-3 flex items-end justify-between gap-1 md:gap-2">
            <div className="min-w-0 flex flex-col leading-tight">
              {hasPromo ? (
                <>
                  <span className="text-sm sm:text-base font-bold text-red-600 whitespace-nowrap">
                    {formatPrice(product.promoPrice)}
                  </span>
                  <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap">
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
              className="relative z-20 -mr-1.5 -mb-1.5 md:m-0 size-11 md:size-10 shrink-0 rounded-full flex items-center justify-center bg-red-50 text-red-600 active:bg-red-600 active:text-white md:bg-transparent md:hover:bg-red-600 md:hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ShoppingCart className="size-5" strokeWidth={1.8} />
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