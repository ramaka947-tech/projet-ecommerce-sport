'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency';
import { getColors } from '@/lib/api';
import { COLOR_PALETTE } from '@/lib/color-palette';
import BackButton from '@/components/back-button';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Images Cloudinary : version légère adaptée à l'écran (f_auto = WebP/AVIF, q_auto = qualité auto)
const cld = (src: string, w: number) =>
  src.includes('/upload/')
    ? src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`)
    : src;

const cldSrcSet = (src: string) =>
  src.includes('/upload/')
    ? [160, 320, 480].map((w) => `${cld(src, w)} ${w}w`).join(', ')
    : undefined;

function ContinueShopping() {
  return (
    <Link
      href="/boutique"
      className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl border border-line bg-white px-5 py-3 text-base font-semibold text-ink transition-colors active:border-action active:text-action sm:inline-flex sm:w-auto md:min-h-0 md:hover:border-action md:hover:text-action"
    >
      <ArrowLeft size={20} aria-hidden="true" />
      Continuer mes achats
    </Link>
  );
}

export default function CartPage() {
  const { items, loaded, updateQuantity, removeItem, subtotal } = useCart();
  const { formatPrice } = useCurrency();

  // Codes couleur pour afficher la pastille à côté du nom
  const [hexByName, setHexByName] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    getColors()
      .then((list: { name: string; hex?: string }[]) => {
        if (!active) return;
        const map: Record<string, string> = {};
        list.forEach((c) => {
          if (c.hex) map[norm(c.name)] = c.hex;
        });
        setHexByName(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const hexOf = (name: string) =>
    hexByName[norm(name)] ||
    COLOR_PALETTE.find((c) => norm(c.name) === norm(name))?.hex ||
    '#E5E5E5';

  const count = items.length;

  /* ---------- Panier en cours de lecture (évite le flash « panier vide ») ---------- */
  if (!loaded) {
    return (
      <main className="bg-canvas text-ink md:min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-10">
          <div className="mb-4 sm:-mt-2 sm:mb-5">
            <BackButton fallback="/boutique" />
          </div>
          <h1 className="text-2xl font-bold text-balance sm:text-4xl">Mon panier</h1>
          <div
            role="status"
            aria-busy="true"
            aria-label="Chargement du panier"
            className="mt-5 space-y-3 sm:mt-6"
          >
            <div className="h-32 animate-pulse rounded-2xl bg-line/60" />
            <div className="h-32 animate-pulse rounded-2xl bg-line/60" />
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Panier vide ---------- */
  if (count === 0) {
    return (
      <main className="bg-canvas text-ink md:min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-10">
          <div className="mb-4 sm:-mt-2 sm:mb-5">
            <BackButton fallback="/boutique" />
          </div>
          <h1 className="text-2xl font-bold text-balance sm:text-4xl">Mon panier</h1>

          <div className="mt-6 rounded-2xl border border-line bg-white p-8 text-center sm:mt-8 sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-canvas text-ink/40">
              <ShoppingCart size={30} aria-hidden="true" />
            </div>
            <p className="mt-5 text-xl font-semibold">Votre panier est vide</p>
            <p className="mt-1 text-ink/70 md:text-ink/60">
              Ajoutez des articles depuis la boutique pour les retrouver ici.
            </p>
            <Link
              href="/boutique"
              className="mt-7 flex min-h-12 w-full touch-manipulation items-center justify-center rounded-xl bg-action px-8 py-3.5 font-semibold text-white transition-colors active:bg-action-dark sm:inline-flex sm:w-auto md:min-h-0 md:hover:bg-action-dark"
            >
              Voir la boutique
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ---------- Panier avec articles ---------- */
  return (
    <main className="bg-canvas text-ink md:min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-10">
        <div className="mb-4 sm:-mt-2 sm:mb-5">
          <BackButton fallback="/boutique" />
        </div>
        <h1 className="text-2xl font-bold text-balance sm:text-4xl">Mon panier</h1>
        <p className="mt-1 text-ink/70 md:text-ink/60">
          {count} {count > 1 ? 'articles dans votre panier' : 'article dans votre panier'}
        </p>

        {/* Liste : une seule carte, articles séparés par un trait */}
        <div className="mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white sm:mt-6">
          {items.map((item) => {
            const sizeLabel = item.size && /^\d/.test(String(item.size)) ? 'Pointure' : 'Taille';
            return (
              // Mobile : ligne 1 = image + infos, ligne 2 = quantité / total / supprimer.
              // Dès sm : mise en page d'origine.
              <div
                key={item.id}
                className="flex flex-wrap gap-x-4 gap-y-3 p-4 sm:flex-nowrap sm:gap-5 sm:p-6"
              >
                {/* Image, proportions respectées */}
                <div className="flex w-24 shrink-0 items-start justify-center sm:w-40">
                  {item.image ? (
                    <img
                      src={cld(item.image, 320)}
                      srcSet={cldSrcSet(item.image)}
                      sizes="(min-width: 640px) 160px, 96px"
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="block h-auto max-h-24 w-auto max-w-full rounded-xl sm:max-h-44"
                    />
                  ) : (
                    <div className="aspect-square w-full rounded-xl bg-canvas" />
                  )}
                </div>

                {/* « contents » : sur mobile, ce bloc disparaît et ses enfants passent sur la ligne du dessous */}
                <div className="contents sm:flex sm:min-w-0 sm:flex-1 sm:flex-col sm:gap-4 lg:flex-row lg:items-center lg:gap-6">
                  {/* Infos */}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words text-base font-bold text-ink sm:text-lg">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm text-ink/70 md:text-ink/50">
                      {formatPrice(item.price)} / unité
                    </p>

                    {(item.color || item.size) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {item.color && (
                          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-canvas py-1.5 pl-1.5 pr-3.5 text-sm font-medium">
                            <span
                              aria-hidden="true"
                              className="size-5 shrink-0 rounded-full border border-line"
                              style={{ backgroundColor: hexOf(item.color) }}
                            />
                            <span className="min-w-0 break-words">{item.color}</span>
                          </span>
                        )}
                        {item.size && (
                          <span className="inline-flex items-center rounded-full border border-line bg-canvas px-3.5 py-1.5 text-sm font-medium">
                            {sizeLabel} {item.size}
                          </span>
                        )}
                      </div>
                    )}

                    {item.note && (
                      <p className="mt-2 break-words text-xs italic text-ink/70 md:text-ink/50">
                        Précision : {item.note}
                      </p>
                    )}

                    {/* Explique pourquoi le bouton « + » est grisé (mobile uniquement) */}
                    {item.quantity >= item.stock && (
                      <p role="status" className="mt-2 text-xs font-semibold text-alert md:hidden">
                        Quantité maximale disponible
                      </p>
                    )}
                  </div>

                  {/* Quantité, total, suppression */}
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:gap-4 lg:justify-end">
                    <div className="inline-flex shrink-0 items-center rounded-xl border border-line bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Diminuer la quantité de ${item.name}`}
                        className="flex size-11 touch-manipulation items-center justify-center active:text-action disabled:opacity-30 sm:size-10 md:hover:text-action"
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <span aria-live="polite" className="w-10 text-center font-semibold sm:w-9">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label={`Augmenter la quantité de ${item.name}`}
                        className="flex size-11 touch-manipulation items-center justify-center active:text-action disabled:opacity-30 sm:size-10 md:hover:text-action"
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>

                    <p className="min-w-0 flex-1 text-right text-base font-bold text-ink sm:flex-none sm:text-left sm:text-lg lg:w-32 lg:text-right">
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Supprimer ${item.name} du panier`}
                      className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-ink/70 transition active:bg-action-soft active:text-action sm:size-10 md:text-ink/40 md:hover:bg-action-soft md:hover:text-action"
                    >
                      <Trash2 size={19} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continuer mes achats */}
        <div className="mt-4 sm:mt-5">
          <ContinueShopping />
        </div>

        {/* Sous-total + validation.
            Mobile : barre collée au-dessus de la barre de navigation, toujours visible.
            Dès md : bloc normal, comme avant. */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-6 md:static md:shadow-none">
          <div className="flex items-baseline justify-between gap-3 sm:block">
            <p className="text-sm text-ink/70 md:text-ink/60">Sous-total</p>
            <p className="break-words text-2xl font-bold text-ink sm:text-3xl">
              {formatPrice(subtotal)}
            </p>
          </div>
          <Link
            href="/commande"
            className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl bg-action px-6 py-3 text-base font-semibold text-white transition-colors active:bg-action-dark sm:w-auto sm:px-10 sm:py-4 sm:text-lg md:min-h-0 md:hover:bg-action-dark"
          >
            Passer la commande
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  );
}