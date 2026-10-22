import Link from 'next/link';
import {
  Star,
  Check,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Gift,
  Clock,
  Phone,
  BadgeCheck,
} from 'lucide-react';
import { getProductById, getProducts, getSettings } from '@/lib/api';
import BackButton from './back-button';
import ImageGallery from './image-gallery';
import ProductPurchase from './product-purchase';
import ProductTabs from './product-tabs';
import PriceTag from './price-tag';
import ProductCard from '@/components/product-card';
import ReviewsSection from '@/components/reviews-section';
import { isNumericSizes, sortSizes } from '@/lib/sizes';

type Spec = { label: string; value: string; summary?: boolean };
type Reassurance = { icon?: string; title: string; subtitle?: string };

const ICONS: Record<string, any> = {
  truck: Truck,
  shield: ShieldCheck,
  return: RotateCcw,
  support: Headphones,
  gift: Gift,
  clock: Clock,
  phone: Phone,
  badge: BadgeCheck,
};

const DUPLICATE_LABELS = ['marque', 'couleur', 'couleurs', 'taille', 'tailles', 'tailles disponibles'];

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split('\n').map((s) => s.trim()).filter(Boolean);
  return [];
}

function toSpecs(value: unknown): Spec[] {
  if (!Array.isArray(value)) return [];
  return value.filter((s: any) => s && s.label && s.value);
}

function parseReassurance(raw?: string): Reassurance[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r) => r && r.title) : [];
  } catch {
    return [];
  }
}

function sizeRange(sizes: any[]): string {
  const names = sizes.map((s) => String(s.name ?? s));
  const nums = names.map(Number);
  if (nums.every((n) => !Number.isNaN(n)) && nums.length > 1) {
    return `${Math.min(...nums)} - ${Math.max(...nums)}`;
  }
  return names.join(', ');
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  const [settings, similar] = await Promise.all([
    getSettings().catch(() => ({}) as Record<string, string>),
    loadSimilar(product),
  ]);

  const rating = Number(product.ratingAverage) || 0;
  const ratingCount = Number(product.ratingCount) || 0;
  const stock: number | undefined =
    typeof product.stock === 'number' ? product.stock : undefined;

  const brandName: string | undefined = toList(product.brands).join(', ') || undefined;
  const sizes: string[] = sortSizes(toList(product.sizes));
  const highlights = toList(product.highlights);
  const specs = toSpecs(product.specs);
  const extraSpecs = specs.filter((s) => !DUPLICATE_LABELS.includes(s.label.trim().toLowerCase()));
  const reassurance = parseReassurance(settings?.product_reassurance);

  const quickInfos: { label: string; value: string }[] = [];
  if (brandName) quickInfos.push({ label: 'Marque', value: String(brandName) });
  if (sizes.length > 0)
    quickInfos.push({
      label: isNumericSizes(sizes) ? 'Pointures disponibles' : 'Tailles disponibles',
      value: sizeRange(sizes),
    });
  specs
    .filter((s) => s.summary)
    .forEach((s) => quickInfos.push({ label: s.label, value: s.value }));
  const quick = quickInfos.slice(0, 3);

  const tabs: { id: string; label: string; content: React.ReactNode }[] = [];

  if (product.description || highlights.length > 0) {
    tabs.push({
      id: 'description',
      label: 'Description',
      content: (
        <div className="max-w-3xl">
          <div>
            <h2 className="text-lg font-bold mb-3 text-ink">Description du produit</h2>
            {product.description && (
              <p className="text-ink/70 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}
            {highlights.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-3 text-ink/80">
                    <span className="w-5 h-5 shrink-0 rounded-full bg-action text-white flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ),
    });
  }

  if (extraSpecs.length > 0) {
    tabs.push({
      id: 'specs',
      label: 'Caractéristiques',
      content: (
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {extraSpecs.map((s, i) => (
            <div key={i}>
              <dt className="text-xs text-ink/50">{s.label}</dt>
              <dd className="mt-0.5 font-medium text-ink">{s.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  tabs.push({
    id: 'reviews',
    label: ratingCount > 0 ? `Avis (${ratingCount})` : 'Avis',
    content: (
      <div className="max-h-[460px] overflow-y-auto pr-2 [&>section]:mt-0 [&>section]:pt-0 [&>section]:border-t-0 [&>section]:max-w-none">
        <ReviewsSection productId={product.id} />
      </div>
    ),
  });

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Retour + fil d'Ariane */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BackButton />
          <nav
            aria-label="Fil d'Ariane"
            className="flex flex-wrap items-center gap-1 text-sm text-ink/50"
          >
            <Link href="/" className="hover:text-ink">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/boutique" className="hover:text-ink">Boutique</Link>
            {product.category?.name && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/boutique?categoryId=${product.category.id}`}
                  className="hover:text-ink"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-ink line-clamp-1">{product.name}</span>
          </nav>
        </div>

        {/* Bloc principal */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-12 bg-white rounded-2xl border border-line shadow-sm p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[480px] mx-auto lg:mx-0 lg:sticky lg:top-24 self-start">
            {product.images?.length > 0 ? (
              <ImageGallery images={product.images} alt={product.name} />
            ) : (
              <div className="aspect-square rounded-2xl bg-canvas flex items-center justify-center text-ink/40 text-sm">
                Aucune image
              </div>
            )}
          </div>

          <div>
            {product.category?.name && (
              <p className="text-xs uppercase tracking-wider text-ink/50">
                {product.category.name}
              </p>
            )}

            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-ink leading-tight">
              {product.name}
            </h1>

            {ratingCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i <= Math.round(rating)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-line'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-ink/60">
                  {rating} ({ratingCount} avis)
                </span>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-canvas px-4 py-3">
              <PriceTag price={product.price} promoPrice={product.promoPrice} />
            </div>

            {stock !== undefined && stock === 0 && (
              <p className="mt-3 text-sm font-medium text-alert">
                ● Rupture de stock
              </p>
            )}

            {product.shortDescription && (
              <p className="mt-4 text-ink/70 leading-relaxed">{product.shortDescription}</p>
            )}

            {quick.length > 0 && (
              <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                {quick.map((q, i) => (
                  <div key={i}>
                    <dt className="text-xs text-ink/50">{q.label}</dt>
                    <dd className="text-sm font-semibold text-ink">{q.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <hr className="my-6 border-line" />

            <ProductPurchase
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                promoPrice: product.promoPrice,
                images: product.images,
                category: product.category,
                stock: product.stock,
                colors: product.colors,
                sizes: product.sizes,
              }}
            />

            {reassurance.length > 0 && (
              <ul className="mt-6 grid gap-px sm:grid-cols-2 rounded-xl overflow-hidden border border-line bg-line">
                {reassurance.map((r, i) => {
                  const Icon = ICONS[r.icon ?? ''] ?? BadgeCheck;
                  return (
                    <li key={i} className="flex items-center gap-3 bg-white p-4">
                      <span className="w-10 h-10 shrink-0 rounded-full bg-action-soft text-action flex items-center justify-center">
                        <Icon className="w-5 h-5" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-ink/50">{r.subtitle}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <ProductTabs tabs={tabs} />
        </div>

        {similar.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-xl font-bold text-ink">Produits similaires</h2>
              <Link
                href={
                  product.category?.id
                    ? `/boutique?categoryId=${product.category.id}`
                    : '/boutique'
                }
                className="text-sm font-semibold text-action hover:underline"
              >
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
              {similar.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

async function loadSimilar(product: any): Promise<any[]> {
  const categoryId = product.category?.id ?? product.categoryId;
  if (!categoryId) return [];
  try {
    const res: any = await getProducts({ categoryId, limit: '5' });
    const items: any[] = Array.isArray(res) ? res : (res?.items ?? []);
    return items.filter((p) => p.id !== product.id).slice(0, 4);
  } catch {
    return [];
  }
}