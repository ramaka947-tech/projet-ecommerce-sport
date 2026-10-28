'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFavorites } from '@/lib/favorites-context';
import ProductCard from '@/components/product-card';
import BackButton from '@/components/back-button';
import { getProductReviews } from '@/lib/api';

type Rating = { average: number; total: number };

export default function FavorisPage() {
  const { favorites, loaded } = useFavorites();
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const requested = useRef<Set<string>>(new Set());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // On ne demande les avis que pour les produits pas encore interrogés :
  // retirer un favori ne relance donc plus toutes les requêtes.
  useEffect(() => {
    const missing = favorites.filter((p) => !requested.current.has(String(p.id)));
    missing.forEach((p) => requested.current.add(String(p.id)));

    missing.forEach(async (p) => {
      try {
        const r = await getProductReviews(p.id);
        if (!mounted.current) return;
        setRatings((prev) => ({
          ...prev,
          [String(p.id)]: { average: r.average, total: r.total },
        }));
      } catch {
        // pas d'avis : le produit s'affiche sans étoiles
      }
    });
  }, [favorites]);

  // Les produits s'affichent tout de suite ; les étoiles arrivent ensuite.
  const items = useMemo(
    () =>
      favorites.map((p) => {
        const r = ratings[String(p.id)];
        return r ? { ...p, ratingAverage: r.average, ratingCount: r.total } : p;
      }),
    [favorites, ratings]
  );

  const count = items.length;

  return (
    <main className="bg-canvas text-ink md:min-h-screen">
      <div className="mx-auto max-w-375 px-4 py-4 sm:px-6 md:py-8">
        <BackButton fallback="/boutique" className="mb-4 md:mb-6" />

        <div className="mb-5 md:mb-6">
          <h1 className="text-2xl font-extrabold text-balance sm:text-3xl">Mes favoris</h1>
          {loaded && (
            <p role="status" className="mt-1 text-sm text-ink/70 md:text-ink/60">
              {count} produit{count > 1 ? 's' : ''} enregistré{count > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!loaded ? (
          <div
            className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-4"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-4/5 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : count === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center md:p-16">
            <p className="text-ink/70 md:text-ink/60">Vous n&apos;avez pas encore de favoris.</p>
            <Link
              href="/boutique"
              className="mt-4 inline-flex min-h-12 w-full touch-manipulation items-center justify-center rounded-lg bg-action px-5 text-sm font-semibold text-white transition active:bg-action-dark md:inline-block md:min-h-0 md:w-auto md:py-2.5 md:hover:bg-action-dark"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-6 md:gap-y-8 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}