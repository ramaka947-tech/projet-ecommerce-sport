import HeroCarousel, { type HeroMedia } from './hero-carousel';
import { CategoryRow, ProductCard, SectionHeader, type Category, type Product } from './home-blocks';

type Props = {
  media: HeroMedia[];
  categories: Category[];
  products: Product[];
};

/**
 * À afficher sous le header mobile. `md:hidden` : la version desktop reste inchangée.
 * Le padding bas évite que la barre de navigation fixe masque le dernier produit.
 */
export default function MobileHome({ media, categories, products }: Props) {
  return (
    <div className="md:hidden flex flex-col gap-7 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      {/* Le carrousel remplit son parent : on lui donne une hauteur et des coins arrondis. */}
      <div className="mx-4 h-[230px] rounded-2xl overflow-hidden bg-ink">
        <HeroCarousel media={media} />
      </div>

      <section aria-labelledby="cat-title">
        <SectionHeader id="cat-title" title="Catégories" href="/boutique" />
        <CategoryRow categories={categories} />
      </section>

      <section aria-labelledby="sel-title">
        <SectionHeader id="sel-title" title="Sélection du moment" href="/boutique" />
        <div className="grid grid-cols-2 gap-3 px-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}