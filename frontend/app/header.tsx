'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, ShoppingCart, User, Search } from 'lucide-react';
import { getSettings } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { useCart } from '@/lib/cart-context';

export default function Header() {
  const [shopName, setShopName] = useState('SportPro');
  const [search, setSearch] = useState('');
  const { isLoggedIn } = useCustomerAuth();
  const { items } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    getSettings().then((s) => s.shop_name && setShopName(s.shop_name)).catch(() => { });
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('search', search);
    else params.delete('search');
    router.push(`/boutique?${params.toString()}`);
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="hidden md:flex border-b px-6 py-4 items-center gap-4 bg-white">
      <Link href="/" className="text-2xl font-extrabold whitespace-nowrap">
        {shopName}
      </Link>

      

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full border rounded-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-transparent focus:bg-white focus:border-gray-300 outline-none"
          />
        </div>
      </form>

      <button className="p-2 hover:bg-gray-100 rounded-full" title="Favoris">
        <Heart size={22} />
      </button>

      <Link
        href="/panier"
        className="relative p-2 hover:bg-gray-100 rounded-full"
        title="Panier"
      >
        <ShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Link>

      <Link
        href={isLoggedIn ? '/mon-compte' : '/compte/connexion'}
        className="p-2 hover:bg-gray-100 rounded-full"
        title="Compte"
      >
        <User size={22} />
      </Link>
    </header>
  );
}