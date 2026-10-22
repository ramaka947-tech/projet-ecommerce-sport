'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';
import AddToCartModal from '@/components/add-to-cart-modal';

// À remplacer par ton helper lib/currency.ts si tu en as un
const fmt = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

export default function ProductCard({ product }: { product: any }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const images: string[] = product.images?.filter(Boolean) ?? [];
  const [idx, setIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const isFav = isFavorite(product.id);
  const hasPromo = !!product.promoPrice;
  const discount = hasPromo
    ? Math.round((1 - product.promoPrice / product.price) * 100)
    : 0;
  const soldOut = typeof product.stock === 'number' && product.stock <= 0;

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function go(e: React.MouseEvent, dir: number) {
    stop(e);
    setIdx((i) => (i + dir + images.length) % images.length);
  }

  // Flèches d'images : visibles sur mobile, au survol sur ordinateur
  const reveal =
    'opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity duration-200';
  const arrowBtn = `absolute top-1/2 -translate-y-1/2 z-20 size-8 rounded-full bg-white/95 shadow flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-colors ${reveal}`;

  return (
    <>
      <div className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-line hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative aspect-[4/5] bg-canvas overflow-hidden">
          {images.length > 0 ? (
            images.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={i === 0 ? product.name : ''}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  i === idx ? 'opacity-100' : 'opacity-0'
                } ${soldOut ? 'grayscale-[40%]' : ''}`}
              />
            ))
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-ink/30">
              <ImageOff size={36} strokeWidth={1.5} className="mb-2" />
              <span className="text-xs">Aucune image</span>
            </div>
          )}

          {/* Pastilles : promo ou rupture */}
          {soldOut ? (
            <span className="absolute top-3 left-3 z-20 bg-ink text-white text-xs font-bold px-2.5 py-1 rounded-full">
              Épuisé
            </span>
          ) : (
            hasPromo && (
              <span className="absolute top-3 left-3 z-20 bg-alert text-white text-xs font-bold px-2.5 py-1 rounded-full">
                -{discount}%
              </span>
            )
          )}

          {/* Favori : toujours visible */}
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              toggleFavorite(product);
            }}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isFav}
            className="absolute top-3 right-3 z-20 size-9 rounded-full bg-white/95 shadow flex items-center justify-center text-ink hover:text-alert transition-colors"
          >
            <Heart
              size={18}
              className={isFav ? 'text-alert' : ''}
              fill={isFav ? 'currentColor' : 'none'}
            />
          </button>

          {/* Flèches + points */}
          {images.length > 1 && (
            <>
              <button type="button" onClick={(e) => go(e, -1)} aria-label="Image précédente" className={`${arrowBtn} left-2`}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={(e) => go(e, 1)} aria-label="Image suivante" className={`${arrowBtn} right-2`}>
                <ChevronRight size={16} />
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
                      i === idx ? 'w-4 bg-action' : 'w-1.5 bg-white/70 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-col flex-1 p-4">
          <p className="text-xs text-ink/50">{product.category?.name || 'Sans catégorie'}</p>

          <h3 className="mt-1 font-semibold text-ink leading-snug line-clamp-2">
            <Link
              href={`/produit/${product.id}`}
              className="after:absolute after:inset-0 after:z-10"
            >
              {product.name}
            </Link>
          </h3>

          <div className="mt-auto pt-3 flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-bold text-ink">
                {fmt(hasPromo ? product.promoPrice : product.price)}
              </span>
              {hasPromo && (
                <span className="text-xs text-ink/50 line-through">{fmt(product.price)}</span>
              )}
            </div>

            {/* Panier : toujours visible, au-dessus du lien de la carte */}
            <button
              type="button"
              disabled={soldOut}
              onClick={(e) => {
                stop(e);
                setShowModal(true);
              }}
              aria-label={soldOut ? 'Produit épuisé' : 'Ajouter au panier'}
              className="relative z-20 size-10 shrink-0 rounded-full bg-action text-white flex items-center justify-center hover:bg-action-dark transition-colors disabled:bg-line disabled:text-ink/40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} />
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