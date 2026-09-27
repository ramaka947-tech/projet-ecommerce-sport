'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeToken } from '@/lib/auth';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/produits', label: 'Produits' },
  { href: '/admin/categories', label: 'Catégories' },
  { href: '/admin/commandes', label: 'Commandes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // La page de login n'a pas besoin de la navigation ni de la protection
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    removeToken();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r p-4 flex flex-col">
        <h2 className="font-bold text-lg mb-6">SportPro Admin</h2>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm ${
                pathname === item.href
                  ? 'bg-black text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline text-left"
        >
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}