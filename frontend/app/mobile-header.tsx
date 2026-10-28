'use client';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { getSettings } from '@/lib/api';

const DEFAULT_SHOP_NAME = 'AD Sport Solutions';
const LOGO_SRC = '/logo.png';

/**
 * Coupe le nom de la boutique en deux couleurs.
 * - "AD Sport Solutions" -> ["AD Sport ", "Solutions"]  (dernier mot en rouge)
 * - "SportPro"           -> ["Sport", "Pro"]            (coupe avant la dernière majuscule)
 * - un seul mot sans majuscule intérieure -> tout en blanc
 */
function splitShopName(name: string): [string, string] {
  const trimmed = name.trim();
  if (trimmed.includes(' ')) {
    const i = trimmed.lastIndexOf(' ') + 1;
    return [trimmed.slice(0, i), trimmed.slice(i)];
  }
  const m = trimmed.match(/^(.+?)([A-Z][a-zà-ÿ]+)$/);
  return m ? [m[1], m[2]] : [trimmed, ''];
}

function ShopName({ name }: { name: string }) {
  const [first, second] = splitShopName(name);
  return (
    <span className="min-w-0 truncate text-xl font-extrabold leading-none tracking-tight min-[380px]:text-2xl">
      {first}
      {second && <span className="text-action">{second}</span>}
    </span>
  );
}

// true  = l'en-tête se cache quand on descend et revient quand on remonte
// false = l'en-tête reste toujours visible en haut (comme la maquette)
const HIDE_ON_SCROLL = false;

function MobileHeaderContent() {
  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [search, setSearch] = useState('');
  const [hidden, setHidden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    getSettings().then((s) => s.shop_name && setShopName(s.shop_name)).catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Masque le header en descendant, le réaffiche dès qu'on remonte.
  useEffect(() => {
    if (!HIDE_ON_SCROLL) return;
    let last = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const typing = document.activeElement === inputRef.current;
        if (Math.abs(y - last) > 8) {
          setHidden(!typing && y > last && y > 120);
          last = y;
        }
        if (y < 10) setHidden(false);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');
    inputRef.current?.blur();
    router.push(`/boutique?${params.toString()}`);
  };

  return (
    <header
      className={`md:hidden sticky top-0 z-40 bg-ink text-white px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <Link href="/" className="flex min-h-11 items-center gap-2.5" aria-label={shopName}>
        <img
          src={LOGO_SRC}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 rounded-full object-cover"
        />
        <ShopName name={shopName} />
      </Link>

      <form onSubmit={handleSearch} role="search" className="mt-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit, une marque…"
            aria-label="Rechercher"
            className="w-full h-12 rounded-full pl-11 pr-11 text-base bg-white text-ink placeholder:text-ink/50 outline-none focus-visible:ring-2 focus-visible:ring-action [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                inputRef.current?.focus();
              }}
              aria-label="Effacer la recherche"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink/50"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>
    </header>
  );
}

// Next.js exige un Suspense autour de useSearchParams().
export default function MobileHeader() {
  return (
    <Suspense fallback={<div className="md:hidden h-[8.25rem] bg-ink" aria-hidden="true" />}>
      <MobileHeaderContent />
    </Suspense>
  );
}