'use client';

import { usePathname } from 'next/navigation';

export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Espace admin : pas de header, de footer ni de nav mobile de la boutique
  if (pathname.startsWith('/admin')) {
    return <div className="flex-1">{children}</div>;
  }

  // Boutique : le padding du bas laisse la place à la MobileNav fixe (4rem + zone sûre de l'iPhone).
  // C'est ICI, et seulement ici, que cet espace est géré : les pages n'ont pas à le refaire.
  return (
    <div className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      {header}
      <div className="flex-1">{children}</div>
      {footer}
    </div>
  );
}