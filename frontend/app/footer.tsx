import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-2xl font-extrabold mb-4">
            SPORT<span className="text-yellow-500">PRO</span>
          </h3>
          <p className="text-green-200 text-sm">
            Tout le matériel pour s'entraîner, jouer et progresser.
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4">Boutique</h4>
          <ul className="space-y-2 text-sm text-green-200">
            <li><Link href="/boutique" className="hover:text-white">Tous les produits</Link></li>
            <li><Link href="/boutique?onSale=true" className="hover:text-white">Promotions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Infos</h4>
          <ul className="space-y-2 text-sm text-green-200">
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/a-propos" className="hover:text-white">À propos</Link></li>
            <li><Link href="/cgv" className="hover:text-white">CGV</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4">Suivez-nous</h4>
          <ul className="space-y-2 text-sm text-green-200">
            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a></li>
            <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a></li>
            <li><a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-green-800 py-4 text-center text-xs text-green-300">
        © {new Date().getFullYear()} SportPro. Tous droits réservés.
      </div>
    </footer>
  );
}