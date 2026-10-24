'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { getSettings } from '@/lib/api';

function MobileHeaderContent() {
  const [shopName, setShopName] = useState('SportPro');
  const [search, setSearch] = useState('');
  const router = useRouter();
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
    router.push(`/boutique?${params.toString()}`);
  };

  return (
    <header className="md:hidden sticky top-0 z-40 bg-ink text-white px-4 pt-3 pb-3">
      <Link href="/" className="flex items-center gap-2" aria-label={shopName}>
        <img src="/logo.png" alt="" className="h-7 w-auto" />
        <span className="text-xl font-extrabold tracking-tight">{shopName}</span>
      </Link>

      <form onSubmit={handleSearch} role="search" className="mt-3">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            aria-label="Rechercher"
            className="w-full rounded-full pl-10 pr-4 py-2.5 text-sm bg-white text-ink placeholder:text-ink/50 outline-none focus-visible:ring-2 focus-visible:ring-action"
          />
        </div>
      </form>
    </header>
  );
}

// Next.js exige un Suspense autour de useSearchParams().
export default function MobileHeader() {
  return (
    <Suspense fallback={<div className="md:hidden h-28 bg-ink" aria-hidden="true" />}>
      <MobileHeaderContent />
    </Suspense>
  );
}