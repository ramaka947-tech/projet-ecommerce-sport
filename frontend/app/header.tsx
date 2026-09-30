'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSettings } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';

export default function Header() {
  const [shopName, setShopName] = useState('SportPro');
  const { isLoggedIn, logout } = useCustomerAuth();

  useEffect(() => {
    getSettings().then((s) => s.shop_name && setShopName(s.shop_name)).catch(() => {});
  }, []);

  return (
    <header className="border-b px-8 py-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">{shopName}</Link>
      <nav className="flex gap-4 text-sm items-center">
        <Link href="/" className="hover:underline">Boutique</Link>
        <Link href="/a-propos" className="hover:underline">À propos</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
        <Link href="/panier" className="hover:underline">Panier</Link>
        {isLoggedIn ? (
          <>
            <Link href="/mon-compte" className="hover:underline">Mon compte</Link>
            <button onClick={logout} className="text-red-500 hover:underline">Déconnexion</button>
          </>
        ) : (
          <Link href="/compte/connexion" className="hover:underline">Connexion</Link>
        )}
      </nav>
    </header>
  );
}