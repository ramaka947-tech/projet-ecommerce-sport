'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFavorites } from '@/lib/favorites-context';
import ProductCard from '@/components/product-card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getProductReviews } from '@/lib/api';

function BackLink() {
  const router = useRouter();
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/boutique');
    }
  };
  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-6 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </button>
  );
}

export default function FavorisPage() {
  const { favorites } = useFavorites();
  const [liveFavorites, setLiveFavorites] = useState<any[]>([]);

  useEffect(() => {
    if (favorites.length === 0) {
      setLiveFavorites([]);
      return;
    }

    Promise.all(
      favorites.map(async (product) => {
        try {
          const reviewsData = await getProductReviews(product.id);
          return {
            ...product,
            ratingAverage: reviewsData.average,
            ratingCount: reviewsData.total,
          };
        } catch {
          return product;
        }
      })
    ).then(setLiveFavorites);
  }, [favorites]);

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-[1500px] mx-auto px-6 py-8">
        <BackLink />

        <div className="mb-6">
          <h1 className="text-3xl font-extrabold">Mes favoris</h1>
          <p className="text-sm text-ink/60 mt-1">
            {liveFavorites.length} produit{liveFavorites.length > 1 ? 's' : ''} enregistré
            {liveFavorites.length > 1 ? 's' : ''}
          </p>
        </div>

        {liveFavorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-line p-16 text-center">
            <p className="text-ink/60">Vous n'avez pas encore de favoris.</p>
            <Link
              href="/boutique"
              className="inline-block mt-4 bg-action text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-action-dark transition"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
            {liveFavorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}