'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Heart, ShoppingCart, User, Search } from 'lucide-react';
import { getSettings } from '@/lib/api';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import ShopName from '@/components/shop-name';

const DEFAULT_SHOP_NAME = 'AD Sport Solutions';
const LOGO_SRC = '/logo.png';

function HeaderContent() {
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [search, setSearch] = useState('');
  const { count: cartCount } = useCart();
  const { count: favCount } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s.shop_name) setShopName(s.shop_name);
      })
      .catch(() => {});
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

  const nav = [
    { label: 'Accueil', href: '/', active: pathname === '/' },
    { label: 'Boutique', href: '/boutique', active: pathname.startsWith('/boutique') },
  ];

  const iconBtn =
    'relative p-2.5 rounded-full text-white hover:bg-white/10 transition';
  const badge =
    'absolute top-0 right-0 bg-action text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center';

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-ink text-white">
      {/* Ligne 1 : logo + recherche + icônes */}
      <div className="max-w-7xl mx-auto px-6 pt-4 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label={shopName}>
          <img
            src={LOGO_SRC}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
          />
          <ShopName name={shopName} className="text-2xl font-extrabold tracking-tight" />
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto" role="search">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit, une catégorie…"
              aria-label="Rechercher"
              className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm bg-white text-ink placeholder:text-ink/50 outline-none focus-visible:ring-2 focus-visible:ring-action"
            />
          </div>
        </form>

        <div className="flex items-center gap-1">
          <Link href="/favoris" className={iconBtn} title="Favoris" aria-label="Favoris">
            <Heart size={22} />
            {favCount > 0 && <span className={badge}>{favCount}</span>}
          </Link>
          <Link href="/panier" className={iconBtn} title="Panier" aria-label="Panier">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className={badge}>{cartCount}</span>}
          </Link>
          <Link href="/mon-compte" className={iconBtn} title="Mon compte" aria-label="Mon compte">
            <User size={22} />
          </Link>
        </div>
      </div>

      {/* Ligne 2 : nav CENTRÉE */}
      <nav className="max-w-7xl mx-auto px-6 mt-1 flex items-center justify-center gap-10">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`whitespace-nowrap py-3 text-sm font-semibold border-b-2 transition ${
              item.active
                ? 'border-action text-white'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

// Next.js exige un Suspense autour de useSearchParams().
// Le fallback réserve la place du header pour éviter un saut de mise en page.
export default function Header() {
  return (
    <Suspense fallback={<div className="hidden md:block h-28 bg-ink" aria-hidden="true" />}>
      <HeaderContent />
    </Suspense>
  );
}