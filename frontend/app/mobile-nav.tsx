'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, SVGProps } from 'react';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
};

const HomeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3 3 10.5V20a1 1 0 0 0 1 1h5.5v-6h5v6H20a1 1 0 0 0 1-1v-9.5z" />
  </svg>
);

const GridIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

const HeartIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s-8.5-5-9.5-11C1.9 6.4 4.2 4 7 4c1.9 0 3.7 1 5 3 1.3-2 3.1-3 5-3 2.8 0 5.1 2.4 4.5 6-1 6-9.5 11-9.5 11z" />
  </svg>
);

const BagIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6.2 8h11.6a1 1 0 0 1 1 .9l1 11a1.5 1.5 0 0 1-1.5 1.6H5.7a1.5 1.5 0 0 1-1.5-1.6l1-11a1 1 0 0 1 1-.9z" />
    <path
      d="M9 8V7a3 3 0 0 1 6 0v1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const UserIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="7.5" r="4" />
    <path d="M4 20.5c0-3.6 3.6-6 8-6s8 2.4 8 6a.5.5 0 0 1-.5.5h-15a.5.5 0 0 1-.5-.5z" />
  </svg>
);

type Item = {
  href: string;
  label: string;
  icon: ComponentType<IconProps>;
  count?: number;
};

export default function MobileNav() {
  const pathname = usePathname();
  const { items } = useCart();
  const { count: favCount } = useFavorites();

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const links: Item[] = [
    { href: '/', label: 'Accueil', icon: HomeIcon },
    { href: '/boutique', label: 'Boutique', icon: GridIcon },
    { href: '/favoris', label: 'Favoris', icon: HeartIcon, count: favCount },
    { href: '/panier', label: 'Panier', icon: BagIcon, count: cartCount },
    { href: '/mon-compte', label: 'Compte', icon: UserIcon },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-1 rounded-3xl bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5">
        {links.map(({ href, label, icon: Icon, count }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              aria-label={count ? `${label}, ${count} article${count > 1 ? 's' : ''}` : label}
              className={`relative flex h-12 items-center justify-center rounded-full transition-all duration-300 ease-out active:scale-95 ${
                active ? 'bg-action px-4 text-white' : 'w-12 text-ink/40 hover:text-ink/70'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon />
                {!!count && count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center ring-2 tabular-nums ${
                      active ? 'bg-white text-action ring-action' : 'bg-action text-white ring-white'
                    }`}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>

              <span
                className={`overflow-hidden whitespace-nowrap text-sm font-medium tracking-tight transition-all duration-300 ease-out ${
                  active ? 'max-w-[100px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}