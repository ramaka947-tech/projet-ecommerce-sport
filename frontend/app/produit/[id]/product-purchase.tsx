'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useFavorites } from '@/lib/favorites-context';
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
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export default function ProductPurchase({ product }: { product: any }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const colors = toList(product.colors);
  const sizes = sortSizes(toList(product.sizes));
  const isShoes = isNumericSizes(sizes);
  const sizeWord = isShoes ? 'pointure' : 'taille';
  const stock: number = product.stock ?? 0;
  const unitPrice = Number(product.promoPrice || product.price);
  const isFav = isFavorite(product.id);
  const outOfStock = stock <= 0;

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
    getColors().then(setColorObjects).catch(() => { });
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

  function submit() {
    if (waitingForColor) return setError('Choisissez au moins une couleur.');
    if (sizes.length > 0 && combos.length === 0)
      return setError(
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

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium border-2 transition ${active
      ? 'bg-action text-white border-action'
      : 'bg-white text-ink/80 border-line hover:border-action'
    }`;

  const input =
    'w-full border border-line rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-action';

  const Stepper = ({ k }: { k: string }) => {
    const q = getQty(k);
    return (
      <div className="inline-flex items-center border border-line rounded-lg shrink-0 bg-white">
        <button
          type="button"
          onClick={() => setQty(k, q - 1)}
          disabled={q <= 1 || outOfStock}
          aria-label="Diminuer la quantité"
          className="w-9 h-9 hover:bg-canvas disabled:opacity-30 text-ink"
        >
          −
        </button>
        <span className="w-10 text-center text-sm text-ink">{q}</span>
        <button
          type="button"
          onClick={() => setQty(k, q + 1)}
          disabled={q >= stock || outOfStock}
          aria-label="Augmenter la quantité"
          className="w-9 h-9 hover:bg-canvas disabled:opacity-30 text-ink"
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Couleurs : pastilles à cocher (produit sans tailles) */}
      {sizes.length === 0 && (colors.length > 0 || !outOfStock) && (
        <div>
          <p className="text-sm font-semibold mb-2 text-ink">
            Couleurs {colors.length > 0 && <span className="text-alert">*</span>}{' '}
            {colors.length > 0 && (
              <span className="font-normal text-ink/40">(plusieurs choix possibles)</span>
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
                    className="flex flex-col items-center gap-1.5 w-16"
                  >
                    <span
                      className={`relative w-11 h-11 rounded-full border-2 transition flex items-center justify-center ${active ? 'border-action' : 'border-line hover:border-ink/40'
                        }`}
                      style={{ backgroundColor: hex }}
                    >
                      {active && (
                        <Check
                          size={16}
                          className={isLight(hex) ? 'text-ink' : 'text-white'}
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <span
                      className={`text-xs text-center leading-tight ${active ? 'font-semibold text-action' : 'text-ink/70'
                        }`}
                    >
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink/50">Aucune couleur disponible pour ce produit.</p>
          )}
        </div>
      )}

      {/* Produit SANS liste de tailles : saisie libre */}
      {sizes.length === 0 && !outOfStock && (
        <div>
          <p className="text-sm font-semibold mb-2 text-ink">Tailles</p>
          <input
            value={sizeText}
            onChange={(e) => {
              setSizeText(e.target.value);
              setAdded(0);
            }}
            placeholder="Ex : M, L, 42"
            className={input}
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
          <p className="text-xs text-ink/50 mt-0.5 mb-3">
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
                  className={`rounded-xl border-2 p-4 transition ${picked.length > 0 ? 'border-action' : 'border-line'
                    }`}
                >
                  {c && (
                    <div className="flex items-center gap-2.5 mb-3">
                      <span
                        className="w-6 h-6 rounded-full border border-line shrink-0"
                        style={{ backgroundColor: hexOf(c) }}
                      />
                      <span className="font-semibold text-ink text-sm">{c}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={picked.includes(s)}
                        onClick={() => toggleSize(c, s)}
                        className={`${chip(picked.includes(s))} min-w-[3rem]`}
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
                            <Stepper k={key} />
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
            <p className="text-sm text-ink/50">Choisissez une couleur pour régler la quantité.</p>
          ) : (
            <div className="rounded-xl border border-line divide-y divide-line">
              {combos.map((c) => {
                const label = [c.color, c.size].filter(Boolean).join(' · ');
                return (
                  <div key={c.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-sm text-ink/80 truncate">{label || 'Quantité'}</span>
                    <Stepper k={c.key} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Précision */}
      <div>
        <p className="text-sm font-semibold mb-2 text-ink">
          Précision <span className="font-normal text-ink/40">(facultatif)</span>
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Flocage, message pour le vendeur…"
          className={input}
        />
      </div>

      {error && <p className="text-sm text-alert">{error}</p>}

      {added > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-success-soft border border-success/30 px-4 py-3 text-sm">
          <span className="text-success font-medium">
            ✓ {added > 1 ? `${added} variantes ajoutées` : 'Ajouté'} au panier
          </span>
          <Link href="/panier" className="font-semibold underline text-success">
            Voir le panier
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={outOfStock}
          className="flex-1 flex items-center justify-center gap-2 bg-action hover:bg-action-dark text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          {outOfStock
            ? 'Rupture de stock'
            : `Ajouter au panier${totalQty > 0 ? ` · ${(unitPrice * totalQty).toLocaleString('fr-FR')} FCFA` : ''}`}
        </button>

        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="w-14 rounded-xl border-2 border-line hover:border-action flex items-center justify-center transition"
        >
          <Heart
            size={22}
            className={isFav ? 'text-alert' : 'text-ink/60'}
            fill={isFav ? 'currentColor' : 'none'}
          />
        </button>
      </div>
    </div>
  );
}