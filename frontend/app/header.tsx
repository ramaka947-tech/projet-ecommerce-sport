import Link from 'next/link';
import { getSettings } from '@/lib/api';

export default async function Header() {
  const settings = await getSettings().catch(() => ({}));
  const shopName = settings.shop_name || 'SportPro';

  return (
    <header className="border-b px-8 py-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">{shopName}</Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/" className="hover:underline">Boutique</Link>
        <Link href="/panier" className="hover:underline">Panier</Link>
      </nav>
    </header>
  );
}