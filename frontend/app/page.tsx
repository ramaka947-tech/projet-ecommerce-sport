'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Dumbbell,
  Circle,
  Target,
  Zap,
  Footprints,
  Package,
  Flame,
  Star,
} from 'lucide-react';
import { getCategories, getProducts, getSettings, getHeroMedia } from '@/lib/api';
import HeroCarousel from './hero-carousel';
import ProductCard from '@/components/product-card';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [heroMedia, setHeroMedia] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getProducts({ sort: 'recent' })
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoaded(true));
    getSettings().then(setSettings).catch(() => {});
    getHeroMedia().then(setHeroMedia).catch(() => {});
  }, []);

  // Promotions : 4 premiers produits en promo
  const allOnSale = products.filter((p) => p.promoPrice);
  const onSale = allOnSale.slice(0, 4);
  const usedIds = new Set(onSale.map((p) => p.id));

  // Sélection : produits mis en avant (isFeatured), sinon 4 derniers restants
  const hasFeatured = products.some((p) => p.isFeatured);
  const selection = products
    .filter((p) => !usedIds.has(p.id) && (hasFeatured ? p.isFeatured : true))
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-canvas text-ink pb-12 md:pb-16">
      {/* Hero */}
      <section className="relative w-full h-[70vh] min-h-[460px] max-h-[720px] overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          {heroMedia.length > 0 && <HeroCarousel media={heroMedia} />}
        </div>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-ink/90 via-ink/50 to-transparent" />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center pointer-events-none">
          <div className="max-w-xl pointer-events-auto">
            <h1 className="text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
              {settings.hero_title || 'Bienvenue'}
            </h1>
            {settings.hero_subtitle && (
              <p className="mt-5 text-base md:text-lg text-white/85 max-w-md">
                {settings.hero_subtitle}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {settings.hero_primary_label && (
                <Link
                  href={settings.hero_primary_link || '/boutique'}
                  className="inline-flex items-center gap-2 bg-action text-white font-semibold px-7 py-3 rounded-full hover:bg-action-dark transition"
                >
                  {settings.hero_primary_label}
                  <ArrowRight size={18} />
                </Link>
              )}
              {settings.hero_secondary_label && (
                <Link
                  href={settings.hero_secondary_link || '/boutique'}
                  className="inline-flex items-center border border-white/60 text-white font-semibold px-7 py-3 rounded-full hover:bg-white hover:text-ink transition"
                >
                  {settings.hero_secondary_label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      {categories.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeader title="Catégories" href="/boutique" linkLabel="Voir toute la boutique" />
            <div className="mt-8 flex gap-6 md:gap-12 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/boutique?categoryId=${cat.id}`}
                  className="group shrink-0 w-28 sm:w-32 md:w-40 text-center"
                >
                  <div className="relative aspect-square rounded-full overflow-hidden bg-white shadow-sm ring-2 ring-line group-hover:ring-action transition">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-ink/40">
                        <CategoryIcon name={cat.name} />
                      </div>
                    )}
                  </div>
                  <span className="mt-3 block font-semibold group-hover:text-action transition">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notre sélection */}
      {(!loaded || selection.length > 0) && (
        <section className="py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeader
              title="Notre sélection"
              icon={<Star size={24} className="text-action" />}
              href="/boutique"
              linkLabel="Voir toute la boutique"
            />
            {!loaded ? (
              <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] rounded-2xl bg-line animate-pulse" />
                ))}
              </div>
            ) : (
              <ProductGrid products={selection} />
            )}
          </div>
        </section>
      )}

      {/* Promotions (uniquement si des produits sont en promo) */}
      {loaded && onSale.length > 0 && (
        <section className="py-10 md:py-14">
          <div className="max-w-7xl mx-auto px-6">
            <SectionHeader
              title="Promotions"
              icon={<Flame size={24} className="text-action" />}
              href={allOnSale.length > onSale.length ? '/boutique?onSale=true' : undefined}
              linkLabel="Voir toutes les promotions"
            />
            <ProductGrid products={onSale} />
          </div>
        </section>
      )}

      {/* Bandeau promo (géré dans l'admin) */}
      {settings.promo_banner_enabled === 'true' && (
        <section className="py-6 md:py-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative overflow-hidden rounded-2xl bg-ink text-white">
              {settings.promo_banner_image && (
                <img
                  src={settings.promo_banner_image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
              <div className="relative px-6 md:px-12 py-10 md:py-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight">
                    {settings.promo_banner_title}
                  </h2>
                  {settings.promo_banner_subtitle && (
                    <p className="mt-2 text-white/80 md:text-lg">
                      {settings.promo_banner_subtitle}
                    </p>
                  )}
                </div>
                {settings.promo_banner_button_label && (
                  <Link
                    href={settings.promo_banner_link || '/boutique'}
                    className="inline-flex items-center gap-2 self-start bg-action text-white font-semibold px-7 py-3 rounded-full hover:bg-action-dark whitespace-nowrap transition"
                  >
                    {settings.promo_banner_button_label}
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function SectionHeader({
  title,
  icon,
  href,
  linkLabel,
}: {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl md:text-3xl font-extrabold tracking-tight">
          {icon}
          {title}
        </h2>
        <div className="mt-2 h-1 w-10 rounded-full bg-action" />
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-action hover:text-action-dark transition"
        >
          {linkLabel}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: any[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('foot') || n.includes('ballon')) return <Circle size={32} />;
  if (n.includes('muscu') || n.includes('haltère')) return <Dumbbell size={32} />;
  if (n.includes('fit') || n.includes('yoga')) return <Zap size={32} />;
  if (n.includes('box') || n.includes('gant')) return <Target size={32} />;
  if (n.includes('run') || n.includes('course')) return <Footprints size={32} />;
  return <Package size={32} />;
}