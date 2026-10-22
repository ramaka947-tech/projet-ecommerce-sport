'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency';
import { getColors } from '@/lib/api';
import { COLOR_PALETTE } from '@/lib/color-palette';
import BackButton from './back-button';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function ContinueShopping() {
  return (
    <Link
      href="/boutique"
      className="inline-flex items-center gap-2.5 text-base font-semibold text-ink border border-line bg-white hover:border-action hover:text-action rounded-xl px-5 py-3 transition-colors"
    >
      <ArrowLeft size={20} />
      Continuer mes achats
    </Link>
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { formatPrice } = useCurrency();

  // Codes couleur pour afficher la pastille à côté du nom
  const [hexByName, setHexByName] = useState<Record<string, string>>({});
  useEffect(() => {
    getColors()
      .then((list: any[]) => {
        const map: Record<string, string> = {};
        list.forEach((c) => c.hex && (map[norm(c.name)] = c.hex));
        setHexByName(map);
      })
      .catch(() => {});
  }, []);
  const hexOf = (name: string) =>
    hexByName[norm(name)] ||
    COLOR_PALETTE.find((c) => norm(c.name) === norm(name))?.hex ||
    '#E5E5E5';

  const count = items.length;

  /* ---------- Panier vide ---------- */
  if (count === 0) {
    return (
      <main className="min-h-screen bg-canvas text-ink">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-5 -mt-2">
          <BackButton />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Mon panier</h1>

          <div className="mt-8 bg-white rounded-2xl border border-line p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-canvas text-ink/40 flex items-center justify-center">
              <ShoppingCart size={30} />
            </div>
            <p className="mt-5 font-semibold text-xl">Votre panier est vide</p>
            <p className="mt-1 text-ink/60">
              Ajoutez des articles depuis la boutique pour les retrouver ici.
            </p>
            <Link
              href="/boutique"
              className="mt-7 inline-block bg-action hover:bg-action-dark text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
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
    <main className="min-h-screen bg-canvas text-ink">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-5 -mt-2">
          <BackButton />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Mon panier</h1>
        <p className="mt-1 text-ink/60">
          {count} {count > 1 ? 'articles dans votre panier' : 'article dans votre panier'}
        </p>

        {/* Liste : une seule carte, articles séparés par un trait */}
        <div className="mt-6 bg-white rounded-2xl border border-line divide-y divide-line overflow-hidden">
          {items.map((item) => {
            const sizeLabel = item.size && /^\d/.test(String(item.size)) ? 'Pointure' : 'Taille';
            return (
              <div key={item.id} className="p-5 sm:p-6 flex gap-5">
                {/* Image agrandie, proportions respectées */}
                <div className="w-28 sm:w-40 shrink-0 flex items-start justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="block w-auto h-auto max-w-full max-h-32 sm:max-h-44 rounded-xl"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-xl bg-canvas" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-ink line-clamp-2">{item.name}</p>
                    <p className="mt-0.5 text-sm text-ink/50">{formatPrice(item.price)} / unité</p>

                    {(item.color || item.size) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {item.color && (
                          <span className="inline-flex items-center gap-2 bg-canvas border border-line rounded-full pl-1.5 pr-3.5 py-1.5 text-sm font-medium">
                            <span
                              className="w-5 h-5 rounded-full border border-line shrink-0"
                              style={{ backgroundColor: hexOf(item.color) }}
                            />
                            {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="inline-flex items-center bg-canvas border border-line rounded-full px-3.5 py-1.5 text-sm font-medium">
                            {sizeLabel} {item.size}
                          </span>
                        )}
                      </div>
                    )}

                    {item.note && (
                      <p className="mt-2 text-xs text-ink/50 italic">Précision : {item.note}</p>
                    )}
                  </div>

                  {/* Quantité, total, suppression */}
                  <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0">
                    <div className="inline-flex items-center border border-line rounded-xl bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Diminuer la quantité"
                        className="w-10 h-10 flex items-center justify-center hover:text-action disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-9 text-center font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Augmenter la quantité"
                        className="w-10 h-10 flex items-center justify-center hover:text-action disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="lg:w-32 lg:text-right text-lg font-bold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Supprimer ${item.name} du panier`}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-ink/40 hover:text-action hover:bg-action-soft transition"
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continuer mes achats */}
        <div className="mt-5">
          <ContinueShopping />
        </div>

        {/* Sous-total + validation */}
        <div className="mt-6 bg-white rounded-2xl border border-line p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-sm text-ink/60">Sous-total</p>
            <p className="text-3xl font-bold text-ink">{formatPrice(subtotal)}</p>
          </div>
          <Link
            href="/commande"
            className="flex items-center justify-center gap-2.5 bg-action hover:bg-action-dark text-white text-lg font-semibold px-10 py-4 rounded-xl transition-colors"
          >
            Passer la commande
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </main>
  );
}