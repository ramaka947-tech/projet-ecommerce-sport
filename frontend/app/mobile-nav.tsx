'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCustomerAuth } from '@/lib/customer-auth-context';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { items } = useCart();
  const { isLoggedIn } = useCustomerAuth();

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const itemClass = (href: string) =>
    `flex flex-col items-center gap-1 text-[10px] flex-1 py-2 ${
      pathname === href ? 'text-black font-semibold' : 'text-gray-500'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center z-50">
      <Link href="/" className={itemClass('/')}>
        <Home size={20} />
        <span>Accueil</span>
      </Link>

      <Link href="/?scroll=shop" className={itemClass('/shop')}>
        <Store size={20} />
        <span>Boutique</span>
      </Link>

      <button
        onClick={() => router.push('/?focus=search')}
        className={itemClass('/search')}
      >
        <Search size={20} />
        <span>Recherche</span>
      </button>

      <Link href="/panier" className={itemClass('/panier')}>
        <div className="relative">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span>Panier ({cartCount})</span>
      </Link>

      <Link
        href={isLoggedIn ? '/mon-compte' : '/compte/connexion'}
        className={itemClass(isLoggedIn ? '/mon-compte' : '/compte/connexion')}
      >
        <User size={20} />
        <span>Compte</span>
      </Link>
    </nav>
  );
}