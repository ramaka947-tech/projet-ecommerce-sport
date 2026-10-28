'use client';
import Link from 'next/link';
import { ArrowRight, Heart, Star } from 'lucide-react';
import { useFavorites } from '@/lib/favorites-context';

/* ---------- Titre de section ---------- */

export function SectionHeader({ title, href, id }: { title: string; href: string; id?: string }) {
  return (
    <div className="flex items-end justify-between px-4 mb-4">
      <h2 id={id} className="text-[22px] font-extrabold text-ink leading-tight">
        {title}
        <span className="block mt-1 h-0.75 w-10 rounded-full bg-action" />
      </h2>
      <Link href={href} className="inline-flex items-center gap-1 h-10 text-sm font-semibold text-action">
        Voir tout
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

/* ---------- Catégories (défilement horizontal) ---------- */

export type Category = { name: string; slug: string; image: string };

export function CategoryRow({ categories }: { categories: Category[] }) {
  return (
    <ul className="flex gap-4 overflow-x-auto snap-x px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c) => (
        <li key={c.slug} className="snap-start shrink-0 w-19">
          <Link
            href={`/boutique?category=${encodeURIComponent(c.slug)}`}
            className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <span className="w-19 h-19 rounded-full bg-black/4 flex items-center justify-center overflow-hidden">
              <img src={c.image} alt="" loading="lazy" className="w-[70%] h-[70%] object-contain" />
            </span>
            <span className="text-[13px] font-medium text-ink text-center leading-tight">{c.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Carte produit ---------- */

export type Product = {
  id: number | string;
  slug: string;
  name: string;
  price: number;
  old_price?: number | null;
  image: string;
  rating?: number;
  reviews_count?: number;
};

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/\u202f/g, ' ')} FCFA`;

/**
 * Adaptateur favoris : c'est le SEUL endroit qui dépend de ton favorites-context.
 * Il accepte les formes les plus courantes (isFavorite/has/liste/Set + toggle/toggleFavorite).
 * Quand tu m'enverras lib/favorites-context.tsx, je le remplace par 2 lignes exactes.
 */
function useFav(id: Product['id']) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = useFavorites() as unknown as Record<string, any>;
  const list = ctx.favorites ?? ctx.ids ?? ctx.items;

  const isFav: boolean =
    typeof ctx.isFavorite === 'function'
      ? !!ctx.isFavorite(id)
      : typeof ctx.has === 'function'
        ? !!ctx.has(id)
        : list instanceof Set
          ? list.has(id)
          : Array.isArray(list)
            ? list.some((f: unknown) => f === id || (f as { id?: unknown })?.id === id)
            : false;

  const toggleFn = ctx.toggle ?? ctx.toggleFavorite ?? ctx.toggleFav;

  const toggle = () => {
    if (typeof toggleFn === 'function') toggleFn(id);
    else console.warn('favorites-context : aucune fonction toggle trouvée');
  };

  return { isFav, toggle };
}

function Stars({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(5, value)) * 20;
  const row = (cls: string) => (
    <div className="flex">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={13} className={cls} />
      ))}
    </div>
  );
  return (
    <div className="relative" role="img" aria-label={`Note : ${value} sur 5`}>
      {row('text-black/15 fill-black/15')}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row('text-amber-400 fill-amber-400')}
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { isFav, toggle } = useFav(product.id);

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round((1 - product.price / product.old_price) * 100)
      : 0;

  return (
    <article className="relative flex flex-col rounded-2xl border border-line bg-white overflow-hidden">
      <Link href={`/produit/${product.slug}`} className="block" aria-label={product.name}>
        <div className="aspect-4/3 bg-black/3 flex items-center justify-center p-3">
          <img src={product.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        </div>
      </Link>

      {discount > 0 && (
        <span className="absolute top-2 left-2 rounded-full bg-action text-white text-xs font-bold px-2.5 py-1">
          -{discount}%
        </span>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-pressed={isFav}
        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className="absolute top-0 right-0 w-11 h-11 flex items-center justify-center text-ink active:scale-90 transition-transform"
      >
        <Heart size={20} className={isFav ? 'fill-action text-action' : ''} />
      </button>

      <Link href={`/produit/${product.slug}`} className="flex flex-col gap-1 p-3 pt-2">
        <h3 className="text-sm text-ink line-clamp-2 min-h-10 leading-tight">{product.name}</h3>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold text-action">{fcfa(product.price)}</span>
          {discount > 0 && (
            <span className="text-[11px] text-ink/50 line-through">{fcfa(product.old_price!)}</span>
          )}
        </div>
        {typeof product.rating === 'number' && (
          <div className="flex items-center gap-1.5">
            <Stars value={product.rating} />
            {!!product.reviews_count && <span className="text-[11px] text-ink/50">({product.reviews_count})</span>}
          </div>
        )}
      </Link>
    </article>
  );
}