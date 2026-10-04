'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Dumbbell, Circle, Target, Zap, Footprints, Package } from 'lucide-react';
import { getCategories, getProducts, getSettings } from '@/lib/api';
import ProductCardImages from './product-card-images';
import HeroCarousel from './hero-carousel';
import { getHeroMedia } from '@/lib/api';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [heroMedia, setHeroMedia] = useState<any[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => { });
    getProducts({ sort: 'recent' }).then((p: any[]) => {
      setPopular(p.slice(0, 4));
      setNewArrivals(p.slice(4, 8));
    }).catch(() => { });
    getSettings().then(setSettings).catch(() => { });
    getHeroMedia().then(setHeroMedia).catch(() => { });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              {settings.hero_title || 'Bienvenue'}
            </h1>
            <p className="text-lg md:text-xl mb-8 text-gray-300">
              {settings.hero_subtitle || ''}
            </p>
            <div className="flex flex-wrap gap-4">
              {settings.hero_primary_label && (
                <Link
                  href={settings.hero_primary_link || '/boutique'}
                  className="bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg hover:opacity-90"
                >
                  {settings.hero_primary_label}
                </Link>
              )}
              {settings.hero_secondary_label && (
                <Link
                  href={settings.hero_secondary_link || '/boutique'}
                  className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-gray-900"
                >
                  {settings.hero_secondary_label}
                </Link>
              )}
            </div>
          </div>

          <div className="relative w-full h-80 md:h-[500px]">
            {heroMedia.length > 0 ? (
              <HeroCarousel media={heroMedia} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Aucun média
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Catégories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500">Aucune catégorie.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/boutique?categoryId=${cat.id}`}
                className="bg-white rounded-xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700">
                  <CategoryIcon name={cat.name} />
                </div>
                <span className="text-sm font-semibold text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Produits populaires */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Produits populaires</h2>
          <Link href="/boutique" className="text-yellow-600 font-semibold hover:underline">
            Tout voir
          </Link>
        </div>

        {popular.length === 0 ? (
          <p className="text-gray-500">Aucun produit.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Bandeau promo */}
      {settings.promo_banner_enabled === 'true' && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="bg-yellow-500 rounded-2xl px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-2">
                {settings.promo_banner_title}
              </h2>
              <p className="text-gray-800 md:text-lg">
                {settings.promo_banner_subtitle}
              </p>
            </div>
            {settings.promo_banner_button_label && (
              <Link
                href={settings.promo_banner_link || '/boutique'}
                className="bg-gray-900 text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 whitespace-nowrap"
              >
                {settings.promo_banner_button_label}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Nouveautés */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Nouveautés</h2>
          <Link href="/boutique" className="text-yellow-600 font-semibold hover:underline">
            Tout voir
          </Link>
        </div>

        {newArrivals.length === 0 ? (
          <p className="text-gray-500">Aucun produit.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <Link
      href={`/produit/${product.id}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition block"
    >
      <div className="relative">
        <ProductCardImages images={product.images} alt={product.name} />
        {product.promoPrice && (
          <span className="absolute top-3 left-3 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
            -{Math.round((1 - product.promoPrice / product.price) * 100)}%
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.category?.name}</p>
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <div className="mb-3">
          {product.promoPrice ? (
            <>
              <span className="font-bold text-gray-900">{product.promoPrice} €</span>
              <span className="text-gray-400 line-through ml-2 text-sm">{product.price} €</span>
            </>
          ) : (
            <span className="font-bold text-gray-900">{product.price} €</span>
          )}
        </div>
        <span className="block text-center bg-gray-900 text-white text-sm font-semibold py-2 rounded-lg">
          Ajouter au panier
        </span>
      </div>
    </Link>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('foot') || n.includes('ballon')) return <Circle size={20} />;
  if (n.includes('muscu') || n.includes('haltère')) return <Dumbbell size={20} />;
  if (n.includes('fit') || n.includes('yoga')) return <Zap size={20} />;
  if (n.includes('box') || n.includes('gant')) return <Target size={20} />;
  if (n.includes('run') || n.includes('course')) return <Footprints size={20} />;
  return <Package size={20} />;
}