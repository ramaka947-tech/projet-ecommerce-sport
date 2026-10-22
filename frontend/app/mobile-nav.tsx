'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Store, Heart, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';

export default function MobileNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const { count: favCount } = useFavorites();

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const itemClass = (href: string) =>
    `flex flex-col items-center gap-1 text-[11px] flex-1 py-2 transition ${
      isActive(href) ? 'text-action font-semibold' : 'text-ink/60'
    }`;

  const badge =
    'absolute -top-1.5 -right-2.5 bg-action text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center';

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-line flex items-center z-50 pb-[env(safe-area-inset-bottom)]"
    >
      <Link href="/" className={itemClass('/')} aria-current={isActive('/') ? 'page' : undefined}>
        <Home size={21} />
        <span>Accueil</span>
      </Link>

      <Link href="/boutique" className={itemClass('/boutique')} aria-current={isActive('/boutique') ? 'page' : undefined}>
        <Store size={21} />
        <span>Boutique</span>
      </Link>

      <Link href="/favoris" className={itemClass('/favoris')} aria-current={isActive('/favoris') ? 'page' : undefined}>
        <div className="relative">
          <Heart size={21} />
          {favCount > 0 && <span className={badge}>{favCount}</span>}
        </div>
        <span>Favoris</span>
      </Link>

      <Link href="/panier" className={itemClass('/panier')} aria-current={isActive('/panier') ? 'page' : undefined}>
        <div className="relative">
          <ShoppingCart size={21} />
          {cartCount > 0 && <span className={badge}>{cartCount}</span>}
        </div>
        <span>Panier</span>
      </Link>

      <Link href="/mon-compte" className={itemClass('/mon-compte')} aria-current={isActive('/mon-compte') ? 'page' : undefined}>
        <User size={21} />
        <span>Compte</span>
      </Link>
    </nav>
  );
}