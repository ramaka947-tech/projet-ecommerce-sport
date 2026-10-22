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

  // Boutique : le pb-16 laisse la place à la MobileNav fixe
  return (
    <div className="flex flex-1 flex-col pb-16 md:pb-0">
      {header}
      <div className="flex-1">{children}</div>
      {footer}
    </div>
  );
}