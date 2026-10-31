'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSettings } from '@/lib/api';
import { LEGAL_LINKS } from '@/lib/legal';
import ShopName from '@/components/shop-name';
import { InstallAppButton } from '@/components/pwa';

const DEFAULT_SHOP_NAME = 'AD Sport Solutions';
const LOGO_SRC = '/logo.png';
const DEFAULT_PHONES = ['78 486 04 22', '70 898 03 53'];

export default function Footer() {
  const [s, setS] = useState<Record<string, string>>({});

  useEffect(() => {
    getSettings().then(setS).catch(() => { });
  }, []);

  const shopName = s.shop_name || DEFAULT_SHOP_NAME;
  const phones = s.contact_phone ? [s.contact_phone] : DEFAULT_PHONES;

  const socials = [
    {
      label: 'Instagram',
      href: s.social_instagram,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: s.social_facebook,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'TikTok',
      href: s.social_tiktok,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z" />
        </svg>
      ),
    },
    {
      label: 'WhatsApp',
      href: s.social_whatsapp
        ? `https://wa.me/${s.social_whatsapp.replace(/\D/g, '')}`
        : '',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
    },
  ].filter((x) => x.href);

  // Sur mobile : cible tactile de 44 px ; sur desktop : lien compact comme avant
  const link =
    'inline-flex min-h-11 items-center break-words text-white/70 transition active:text-white md:min-h-0 md:hover:text-white';

  // Liens légaux (barre du bas) : même logique tactile, un ton plus discret
  const legalLink =
    'inline-flex min-h-11 items-center text-white/60 transition active:text-white md:min-h-0 md:hover:text-white';

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-4 md:gap-8 md:py-12">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="mb-3 flex min-h-11 items-center gap-3" aria-label={shopName}>
            <img
              src={LOGO_SRC}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full object-cover"
            />
            <ShopName
              name={shopName}
              className="min-w-0 text-xl font-extrabold tracking-tight min-[380px]:text-2xl"
            />
          </Link>
          {s.tagline && <p className="text-sm text-white/70">{s.tagline}</p>}
          {s.contact_address && (
            <p className="mt-3 break-words text-sm text-white/70">{s.contact_address}</p>
          )}

          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {socials.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={x.label}
                  className="flex size-11 touch-manipulation items-center justify-center rounded-full bg-white/10 text-white transition active:bg-action md:size-9 md:hover:bg-action"
                >
                  {x.icon}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-2 font-bold md:mb-4">Boutique</h4>
          <ul className="space-y-0 text-sm md:space-y-2">
            <li><Link href="/boutique" className={link}>Tous les produits</Link></li>
            <li><Link href="/boutique?onSale=true" className={link}>Promotions</Link></li>
            <li><Link href="/suivi" className={link}>Suivre ma commande</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 font-bold md:mb-4">Informations</h4>
          <ul className="space-y-0 text-sm md:space-y-2">
            <li><Link href="/contact" className={link}>Contact</Link></li>
            <li><Link href="/a-propos" className={link}>À propos</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h4 className="mb-2 font-bold md:mb-4">Contact</h4>
          <ul className="space-y-0 text-sm md:space-y-2">
            {s.contact_email && (
              <li>
                <a href={`mailto:${s.contact_email}`} className={link}>{s.contact_email}</a>
              </li>
            )}
            {phones.map((phone) => (
              <li key={phone}>
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={link}>{phone}</a>
              </li>
            ))}
          </ul>
          <InstallAppButton className="mt-4" />
        </div>
      </div>

      <div className="border-t border-white/10 px-4 pt-3 pb-[calc(5rem+env(safe-area-inset-bottom))] text-center text-xs text-white/60 md:py-4">
        <nav aria-label="Informations légales" className="mx-auto max-w-7xl">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-0 md:gap-y-1">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={legalLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-1 md:mt-3">
          © {new Date().getFullYear()} {shopName}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}