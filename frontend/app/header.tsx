'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Store, Heart, ShoppingCart, User } from 'lucide-react';
import { getSettings } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { useCart } from '@/lib/cart-context';

export default function Header() {
  const [shopName, setShopName] = useState('SportPro');
  const [search, setSearch] = useState('');
  const { isLoggedIn, logout } = useCustomerAuth();
  const { items } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    getSettings().then((s) => s.shop_name && setShopName(s.shop_name)).catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('search', search);
    else params.delete('search');
    router.push(`/?${params.toString()}`);
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="border-b px-6 py-3 flex items-center gap-6">
      <Link href="/" className="text-2xl font-extrabold whitespace-nowrap">
        {shopName}
      </Link>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full border rounded-full px-4 py-2 text-sm bg-transparent"
        />
      </form>

      <nav className="flex items-center gap-5 text-xs">
        <Link href="/" className="flex flex-col items-center hover:opacity-80">
          <Store size={22} />
          <span>Boutique</span>
        </Link>

        <button className="flex flex-col items-center hover:opacity-80 cursor-pointer">
          <Heart size={22} />
          <span>Favoris</span>
        </button>

        <Link href="/panier" className="flex flex-col items-center hover:opacity-80 relative">
          <div className="relative">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span>Panier</span>
        </Link>

        {isLoggedIn ? (
          <div className="flex flex-col items-center">
            <Link href="/mon-compte" className="flex flex-col items-center hover:opacity-80">
              <User size={22} />
              <span>Compte</span>
            </Link>
          </div>
        ) : (
          <Link href="/compte/connexion" className="flex flex-col items-center hover:opacity-80">
            <User size={22} />
            <span>Compte</span>
          </Link>
        )}
      </nav>
    </header>
  );
}