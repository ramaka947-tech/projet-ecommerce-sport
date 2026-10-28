'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
import { useCurrency } from '@/lib/currency';
import { isNumericSizes, sortSizes } from '@/lib/sizes';
import { getColors } from '@/lib/api';

function toList(value: any): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function isLight(hex?: string) {
  if (!hex) return true;
  const c = hex.replace('#', '');
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export default function ProductPurchase({ product }: { product: any }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatPrice } = useCurrency();

  const colors = toList(product.colors);
  const sizes = sortSizes(toList(product.sizes));
  const isShoes = isNumericSizes(sizes);
  const sizeWord = isShoes ? 'pointure' : 'taille';
  const stock: number = product.stock ?? 0;
  const unitPrice = Number(product.promoPrice || product.price);
  const isFav = isFavorite(product.id);
  const outOfStock = stock <= 0;

  const rootRef = useRef<HTMLDivElement>(null);
  const [colorObjects, setColorObjects] = useState<any[]>([]);
  // Couleurs cochées (uniquement quand le produit n'a pas de tailles)
  const [pickedColors, setPickedColors] = useState<string[]>([]);
  // Tailles choisies POUR CHAQUE couleur : { Bleu: ["38"], Rouge: ["38","46"] }
  // La clé '' sert quand le produit n'a pas de couleurs
  const [sizesByColor, setSizesByColor] = useState<Record<string, string[]>>({});
  const [sizeText, setSizeText] = useState('');
  const [note, setNote] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [added, setAdded] = useState(0);

  useEffect(() => {
    let active = true;
    getColors()
      .then((list) => {
        if (active) setColorObjects(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Map name -> hex
  const colorHex: Record<string, string | undefined> = {};
  colorObjects.forEach((c) => {
    colorHex[c.name] = c.hex || undefined;
  });
  const hexOf = (name: string) => colorHex[name] || '#E5E5E5';

  // Couleurs prises en compte
  const chosenColors = colors.length > 0 ? (sizes.length > 0 ? colors : pickedColors) : [];
  // Groupes : un par couleur (ou un seul groupe sans couleur)
  const groups = chosenColors.length > 0 ? chosenColors : [''];
  const waitingForColor = colors.length > 0 && sizes.length === 0 && pickedColors.length === 0;

  const sizesOf = (color: string): string[] => {
    if (sizes.length > 0) {
      const picked = sizesByColor[color] ?? [];
      return sizes.filter((s) => picked.includes(s)); // garde l'ordre trié
    }
    const free = toList(sizeText);
    return free.length > 0 ? free : [''];
  };

  const toggleSize = (color: string, size: string) => {
    setSizesByColor((prev) => ({ ...prev, [color]: toggle(prev[color] ?? [], size) }));
    setError('');
    setAdded(0);
  };

  // Une ligne de panier par couleur × taille réellement choisie
  const combos = useMemo(() => {
    if (waitingForColor) return [];
    return groups.flatMap((c) =>
      sizesOf(c).map((s) => ({ key: `${c}|${s}`, color: c || undefined, size: s || undefined }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenColors.join('|'), JSON.stringify(sizesByColor), sizeText, waitingForColor]);

  const getQty = (key: string) => quantities[key] ?? 1;
  const setQty = (key: string, q: number) =>
    setQuantities((prev) => ({ ...prev, [key]: Math.max(1, Math.min(stock, q)) }));

  const totalQty = combos.reduce((sum, c) => sum + getQty(c.key), 0);

  // Affiche l'erreur et, sur téléphone, remonte jusqu'aux choix à faire
  function fail(message: string) {
    setError(message);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function submit() {
    if (waitingForColor) return fail('Choisissez au moins une couleur.');
    if (sizes.length > 0 && combos.length === 0)
      return fail(
        colors.length > 0
          ? `Choisissez au moins une ${sizeWord} pour une couleur.`
          : `Choisissez au moins une ${sizeWord}.`
      );

    combos.forEach((c) =>
      addItem({
        productId: product.id,
        name: product.name,
        price: unitPrice,
        image: product.images?.[0],
        stock,
        quantity: getQty(c.key),
        color: c.color,
        size: c.size,
        note: note.trim() || undefined,
      })
    );
    setError('');
    setAdded(combos.length);
  }

  // Pastilles de choix : 44 px de haut sur mobile, 40 px dès md (comme avant)
  const chip = (active: boolean) =>
    `min-h-11 md:min-h-0 touch-manipulation px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${
      active
        ? 'bg-action text-white border-action'
        : 'bg-white text-ink/80 border-line active:border-action md:hover:border-action'
    }`;

  // 16 px sur mobile : sinon l'iPhone zoome au moment de taper
  const input =
    'w-full border border-line rounded-lg px-3 py-2 text-base md:text-sm text-ink placeholder:text-gray-500 focus:outline-none focus:border-action';

  // Fonction (et non composant) : le champ ne se « recrée » pas à chaque tap
  const stepper = (k: string) => {
    const q = getQty(k);
    const btn =
      'size-11 md:size-9 touch-manipulation text-lg md:text-base text-ink active:bg-canvas md:hover:bg-canvas disabled:opacity-30';
    return (
      <div className="inline-flex items-center border border-line rounded-lg shrink-0 bg-white">
        <button
          type="button"
          onClick={() => setQty(k, q - 1)}
          disabled={q <= 1 || outOfStock}
          aria-label="Diminuer la quantité"
          className={btn}
        >
          −
        </button>
        <span aria-live="polite" className="w-10 text-center text-sm text-ink">
          {q}
        </span>
        <button
          type="button"
          onClick={() => setQty(k, q + 1)}
          disabled={q >= stock || outOfStock}
          aria-label="Augmenter la quantité"
          className={btn}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div ref={rootRef} className="scroll-mt-24 space-y-6">
      {/* Couleurs : pastilles à cocher (produit sans tailles) */}
      {sizes.length === 0 && (colors.length > 0 || !outOfStock) && (
        <div>
          <p className="text-sm font-semibold mb-2 text-ink">
            Couleurs {colors.length > 0 && <span className="text-alert">*</span>}{' '}
            {colors.length > 0 && (
              <span className="font-normal text-ink/70 md:text-ink/40">(plusieurs choix possibles)</span>
            )}
          </p>
          {colors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {colors.map((name) => {
                const active = pickedColors.includes(name);
                const hex = hexOf(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setPickedColors((l) => toggle(l, name));
                      setError('');
                      setAdded(0);
                    }}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1.5 w-16 touch-manipulation"
                  >
                    <span
                      className={`relative size-11 rounded-full border-2 transition flex items-center justify-center ${
                        active ? 'border-action' : 'border-line md:hover:border-ink/40'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {active && (
                        <Check
                          size={16}
                          aria-hidden="true"
                          className={isLight(hex) ? 'text-ink' : 'text-white'}
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <span
                      className={`text-xs text-center leading-tight break-words ${
                        active ? 'font-semibold text-action' : 'text-ink/70'
                      }`}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink/70 md:text-ink/50">
              Aucune couleur disponible pour ce produit.
            </p>
          )}
        </div>
      )}

      {/* Produit SANS liste de tailles : saisie libre */}
      {sizes.length === 0 && !outOfStock && (
        <div>
          <label htmlFor="size-free" className="block text-sm font-semibold mb-2 text-ink">
            Tailles
          </label>
          <input
            id="size-free"
            value={sizeText}
            onChange={(e) => {
              setSizeText(e.target.value);
              setAdded(0);
            }}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Ex : M, L, 42"
            className={`${input} min-h-12 md:min-h-0`}
          />
        </div>
      )}

      {/* Produit AVEC tailles : chaque couleur et ses tailles, visibles tout de suite */}
      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink">
            {colors.length > 0
              ? `Couleurs et ${isShoes ? 'pointures' : 'tailles'}`
              : isShoes
                ? 'Pointures'
                : 'Tailles'}{' '}
            <span className="text-alert">*</span>
          </p>
          <p className="text-xs text-ink/70 md:text-ink/50 mt-0.5 mb-3">
            {colors.length > 1
              ? `Choisissez la ou les ${isShoes ? 'pointures' : 'tailles'} voulues pour chaque couleur.`
              : 'Plusieurs choix possibles.'}
          </p>

          <div className="space-y-3">
            {groups.map((c) => {
              const picked = sizesOf(c);
              return (
                <div
                  key={c || 'all'}
                  className={`rounded-xl border-2 p-3 sm:p-4 transition ${
                    picked.length > 0 ? 'border-action' : 'border-line'
                  }`}
                >
                  {c && (
                    <div className="flex items-center gap-2.5 mb-3">
                      <span
                        aria-hidden="true"
                        className="size-6 rounded-full border border-line shrink-0"
                        style={{ backgroundColor: hexOf(c) }}
                      />
                      <span className="font-semibold text-ink text-sm break-words min-w-0">{c}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={picked.includes(s)}
                        onClick={() => toggleSize(c, s)}
                        className={`${chip(picked.includes(s))} min-w-12`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {picked.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {picked.map((s) => {
                        const key = `${c}|${s}`;
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 bg-canvas rounded-lg pl-4 pr-1.5 py-1.5"
                          >
                            <span className="text-sm text-ink/80">
                              {isShoes ? 'Pointure' : 'Taille'} {s}
                            </span>
                            {stepper(key)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Produit SANS liste de tailles : quantité par ligne */}
      {sizes.length === 0 && (
        <div>
          <p className="text-sm font-semibold mb-2 text-ink">Quantité</p>
          {combos.length === 0 ? (
            <p className="text-sm text-ink/70 md:text-ink/50">
              Choisissez une couleur pour régler la quantité.
            </p>
          ) : (
            <div className="rounded-xl border border-line divide-y divide-line">
              {combos.map((c) => {
                const label = [c.color, c.size].filter(Boolean).join(' · ');
                return (
                  <div key={c.key} className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5">
                    <span className="text-sm text-ink/80 truncate min-w-0">{label || 'Quantité'}</span>
                    {stepper(c.key)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Précision */}
      <div>
        <label htmlFor="purchase-note" className="block text-sm font-semibold mb-2 text-ink">
          Précision <span className="font-normal text-ink/70 md:text-ink/40">(facultatif)</span>
        </label>
        <textarea
          id="purchase-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Flocage, message pour le vendeur…"
          className={input}
        />
      </div>

      {/* Actions.
          Mobile : barre collée au-dessus de la barre de navigation, avec les messages dedans
          (on les voit forcément). Dès md : bloc normal, comme avant. */}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 space-y-2 rounded-2xl border border-line bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:static md:space-y-6 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        {error && (
          <p role="alert" className="text-sm text-alert break-words">
            {error}
          </p>
        )}

        {added > 0 && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl bg-success-soft border border-success/30 px-4 py-2 md:py-3 text-sm"
          >
            <span className="text-success font-medium">
              ✓ {added > 1 ? `${added} variantes ajoutées` : 'Ajouté'} au panier
            </span>
            <Link
              href="/panier"
              className="inline-flex min-h-11 md:min-h-0 shrink-0 touch-manipulation items-center font-semibold underline text-success"
            >
              Voir le panier
            </Link>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={outOfStock}
            className="flex min-h-12 min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-action px-3 py-3.5 font-semibold text-white transition-colors active:bg-action-dark md:hover:bg-action-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart size={18} aria-hidden="true" className="shrink-0" />
            {outOfStock ? (
              'Rupture de stock'
            ) : (
              <span className="truncate">
                <span className="sm:hidden">Ajouter</span>
                <span className="hidden sm:inline">Ajouter au panier</span>
                {totalQty > 0 && ` · ${formatPrice(unitPrice * totalQty)}`}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(product)}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={isFav}
            className="flex min-h-12 w-14 shrink-0 touch-manipulation items-center justify-center rounded-xl border-2 border-line transition active:border-action md:hover:border-action"
          >
            <Heart
              size={22}
              aria-hidden="true"
              className={isFav ? 'text-alert' : 'text-ink/60'}
              fill={isFav ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>
    </div>
  );
}