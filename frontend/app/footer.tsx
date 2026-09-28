import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t px-8 py-6 mt-auto text-sm text-gray-500">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-300 mb-1">SportPro</p>
          <p>Votre boutique d'articles de sport.</p>
        </div>
        <nav className="flex gap-4">
          <Link href="/a-propos" className="hover:underline">À propos</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/cgv" className="hover:underline">CGV</Link>
        </nav>
      </div>
    </footer>
  );
}