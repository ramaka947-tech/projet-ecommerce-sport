'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, ShoppingCart, Star, X } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency';
import { getColors } from '@/lib/api';
import { COLOR_PALETTE } from '@/lib/color-palette';

// Accepte un tableau ["Rouge","Bleu"], un tableau d'objets [{name:"Rouge"}] ou une chaîne "Rouge, Bleu"
function toList(value: any): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v : v?.name))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const LETTER_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '3XL', '4XL'];

// Range les tailles : lettres (XS, S, M...), puis pointures (38, 40...), puis le reste
function sortSizes(list: string[]) {
  const rank = (s: string) => {
    const i = LETTER_ORDER.indexOf(s.toUpperCase());
    if (i >= 0) return [0, i] as const;
    if (/^\d/.test(s)) return [1, parseFloat(s.replace(',', '.'))] as const;
    return [2, 0] as const;
  };
  return [...list].sort((a, b) => {
    const [ga, va] = rank(a);
    const [gb, vb] = rank(b);
    return ga - gb || va - vb || a.localeCompare(b);
  });
}

function isLight(hex: string) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function Stepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (q: number) => void;
}) {
  return (
    <div className="inline-flex items-center border border-line rounded-xl bg-white shrink-0">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Diminuer la quantité"
        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center hover:text-action disabled:opacity-30"
      >
        <Minus size={16} />
      </button>
      <span className="w-9 sm:w-10 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Augmenter la quantité"
        className="w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center hover:text-action disabled:opacity-30"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function AddToCartModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const { formatPrice } = useCurrency();
  const colors = toList(product.colors);
  const sizes = sortSizes(toList(product.sizes));
  const stock: number = product.stock ?? 99;
  const unitPrice = Number(product.promoPrice || product.price);

  // Cas principal : le produit a des couleurs ET des tailles
  // -> on affiche chaque couleur avec ses tailles, sans étape de sélection préalable
  const colorCards = colors.length > 0 && sizes.length > 0;

  // Avis (affichés seulement si le produit les fournit)
  const rating = Number(product.rating ?? product.averageRating ?? 0);
  const reviewCount = Number(
    product.reviewCount ?? product.reviewsCount ?? product._count?.reviews ?? 0
  );

  // Codes couleur : on les récupère depuis la base, sinon depuis la palette
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

  // Couleurs cochées (uniquement quand le produit n'a pas de tailles)
  const [pickedColors, setPickedColors] = useState<string[]>([]);
  // Tailles choisies POUR CHAQUE couleur : { Bleu: ["38"], Rouge: ["38","46"] }
  // La clé '' sert quand le produit n'a pas de couleurs
  const [sizesByColor, setSizesByColor] = useState<Record<string, string[]>>({});
  // Saisie libre (si le produit n'a pas d'options) : séparer par des virgules
  const [colorText, setColorText] = useState('');
  const [sizeText, setSizeText] = useState('');

  const [note, setNote] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Couleurs prises en compte
  const chosenColors =
    colors.length > 0 ? (sizes.length > 0 ? colors : pickedColors) : toList(colorText);
  // Groupes : un par couleur (ou un seul groupe sans couleur)
  const groups = chosenColors.length > 0 ? chosenColors : [''];
  const waitingForColor = colors.length > 0 && sizes.length === 0 && pickedColors.length === 0;

  const sizesOf = (color: string): string[] => {
    if (sizes.length > 0) {
      const picked = sizesByColor[color] ?? [];
      return sizes.filter((s) => picked.includes(s));
    }
    const free = toList(sizeText);
    return free.length > 0 ? free : [''];
  };

  const toggleSize = (color: string, size: string) => {
    setSizesByColor((prev) => ({ ...prev, [color]: toggle(prev[color] ?? [], size) }));
    setError('');
  };

  // Une ligne de panier par couleur × taille réellement choisie
  const combos = useMemo(() => {
    if (waitingForColor) return [];
    return groups.flatMap((c) =>
      sizesOf(c).map((s) => ({
        key: `${c}|${s}`,
        color: c || undefined,
        size: s || undefined,
      }))
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
          ? 'Choisissez au moins une taille pour une couleur.'
          : 'Choisissez au moins une taille.'
      );

    combos.forEach((c) => {
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
      });
    });
    setAddedCount(combos.length);
  }

  const sizeChip = (active: boolean) =>
    `min-w-14 px-4 sm:px-5 py-3 sm:py-2.5 rounded-full text-sm font-medium border transition ${
      active
        ? 'bg-action text-white border-action'
        : 'bg-white text-ink border-line hover:border-action'
    }`;

  // text-base (16 px) sur mobile : en dessous, iOS zoome la page au focus et la fenêtre paraît coupée.
  const inputClass =
    'w-full border border-line rounded-xl px-4 py-3 text-base sm:text-sm bg-white focus:outline-none focus:border-action';

  const required = <span className="text-action">*</span>;

  const modal = (
    // z-60 : au-dessus du header (z-40) et de la barre de navigation mobile (z-50).
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ajouter ${product.name} au panier`}
        // dvh = hauteur réellement visible (barre d'adresse du navigateur mobile exclue).
        className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-11 h-11 sm:w-9 sm:h-9 rounded-full bg-white/90 sm:bg-transparent hover:bg-canvas flex items-center justify-center text-ink"
        >
          <X size={22} />
        </button>

        {addedCount > 0 ? (
          /* ---------- Confirmation ---------- */
          <div className="p-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#E7F8EF] text-[#009F5A] flex items-center justify-center">
              <Check size={28} />
            </div>
            <p className="mt-4 text-lg font-bold text-ink">
              {addedCount > 1 ? `${addedCount} variantes ajoutées` : 'Ajouté'} au panier
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-line rounded-xl py-3.5 text-sm font-semibold hover:bg-canvas"
              >
                Continuer mes achats
              </button>
              <Link
                href="/panier"
                className="flex-1 text-center bg-action hover:bg-[#B8141F] text-white rounded-xl py-3.5 text-sm font-semibold transition-colors"
              >
                Voir le panier
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ---------- Contenu défilant ---------- */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-5 sm:space-y-7">
              {/* En-tête produit */}
              <div className="flex gap-4 sm:gap-5 pb-5 sm:pb-6 border-b border-line">
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="block self-start shrink-0 w-auto h-auto max-w-24 max-h-28 sm:max-w-40 sm:max-h-48 rounded-2xl"
                  />
                )}
                <div className="min-w-0 pr-10 sm:pr-8">
                  <h2 className="text-lg sm:text-2xl font-bold text-ink leading-tight line-clamp-2">
                    {product.name}
                  </h2>
                  <p className="mt-1.5 text-xl sm:text-2xl font-bold text-action">
                    {formatPrice(unitPrice)}
                  </p>
                  {rating > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60">
                      <span className="flex text-action" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </span>
                      <span>({rating.toFixed(1)})</span>
                      {reviewCount > 0 && <span>· {reviewCount} avis</span>}
                    </div>
                  )}
                  {product.description && (
                    <p className="mt-2 text-sm text-ink/60 line-clamp-2 sm:line-clamp-3">
                      {product.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Couleurs : pastilles à cocher (produit sans tailles) ou saisie libre */}
              {!colorCards && (
                <div>
                  <p className="font-bold text-ink mb-3">
                    Couleurs {colors.length > 0 && required}{' '}
                    {colors.length > 0 && (
                      <span className="font-normal text-ink/50">(plusieurs choix possibles)</span>
                    )}
                  </p>
                  {colors.length > 0 ? (
                    <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-3">
                      {colors.map((c) => {
                        const hex = hexOf(c);
                        const active = pickedColors.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setPickedColors((l) => toggle(l, c));
                              setError('');
                            }}
                            className="flex flex-col items-center gap-1.5 w-16"
                          >
                            <span
                              className={`w-11 h-11 rounded-full border flex items-center justify-center transition ${
                                active
                                  ? 'border-action ring-2 ring-action ring-offset-2'
                                  : 'border-line'
                              }`}
                              style={{ backgroundColor: hex }}
                            >
                              {active && (
                                <Check size={18} className={isLight(hex) ? 'text-ink' : 'text-white'} />
                              )}
                            </span>
                            <span className="text-xs font-medium text-ink text-center leading-tight">
                              {c}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      value={colorText}
                      onChange={(e) => setColorText(e.target.value)}
                      placeholder="Ex : Noir, Blanc"
                      className={inputClass}
                    />
                  )}
                </div>
              )}

              {/* Produit SANS liste de tailles : saisie libre */}
              {sizes.length === 0 && (
                <div>
                  <p className="font-bold text-ink mb-3">Tailles</p>
                  <input
                    value={sizeText}
                    onChange={(e) => setSizeText(e.target.value)}
                    placeholder="Ex : M, L, 42"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Produit AVEC tailles : chaque couleur et ses tailles, visibles tout de suite */}
              {sizes.length > 0 && (
                <div>
                  <p className="font-bold text-ink mb-1">
                    {colors.length > 0 ? 'Couleurs et tailles' : 'Tailles'} {required}
                  </p>
                  <p className="text-sm text-ink/50 mb-3">
                    {colors.length > 1
                      ? 'Choisissez la ou les tailles voulues pour chaque couleur.'
                      : 'Plusieurs choix possibles.'}
                  </p>

                  {colors.length === 0 && (
                    <input
                      value={colorText}
                      onChange={(e) => setColorText(e.target.value)}
                      placeholder="Couleur (facultatif) — Ex : Noir, Blanc"
                      className={`${inputClass} mb-3`}
                    />
                  )}

                  <div className="space-y-3">
                    {groups.map((c) => {
                      const picked = sizesOf(c);
                      return (
                        <div
                          key={c || 'all'}
                          className={`border rounded-2xl p-3 sm:p-4 transition ${
                            picked.length > 0 ? 'border-action' : 'border-line'
                          }`}
                        >
                          {c && (
                            <div className="flex items-center gap-2.5 mb-3">
                              {colors.length > 0 && (
                                <span
                                  className="w-6 h-6 rounded-full border border-line shrink-0"
                                  style={{ backgroundColor: hexOf(c) }}
                                />
                              )}
                              <span className="font-semibold text-ink">{c}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {sizes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                aria-pressed={picked.includes(s)}
                                onClick={() => toggleSize(c, s)}
                                className={sizeChip(picked.includes(s))}
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
                                    className="flex items-center justify-between gap-3 bg-canvas rounded-xl pl-4 pr-1.5 py-1.5"
                                  >
                                    <span className="text-sm text-ink">Taille {s}</span>
                                    <Stepper
                                      value={getQty(key)}
                                      max={stock}
                                      onChange={(q) => setQty(key, q)}
                                    />
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
                  <p className="font-bold text-ink mb-3">Quantité</p>
                  {combos.length === 0 ? (
                    <p className="text-sm text-ink/50">
                      Choisissez une couleur pour régler la quantité.
                    </p>
                  ) : combos.length === 1 ? (
                    <Stepper
                      value={getQty(combos[0].key)}
                      max={stock}
                      onChange={(q) => setQty(combos[0].key, q)}
                    />
                  ) : (
                    <div className="space-y-2">
                      {combos.map((c) => (
                        <div
                          key={c.key}
                          className="flex items-center justify-between gap-3 border border-line rounded-xl pl-4 pr-1.5 py-1.5"
                        >
                          <span className="text-sm text-ink truncate">
                            {[c.color, c.size].filter(Boolean).join(' · ')}
                          </span>
                          <Stepper
                            value={getQty(c.key)}
                            max={stock}
                            onChange={(q) => setQty(c.key, q)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Précision */}
              <div>
                <p className="font-bold text-ink mb-3">
                  Précision <span className="font-normal text-ink/50">(facultatif)</span>
                </p>
                <div className="relative">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="Ex : taille spéciale, message pour le vendeur…"
                    className={`${inputClass} resize-none pb-6`}
                  />
                  <span className="absolute bottom-2 right-4 text-xs text-ink/40">
                    {note.length}/200
                  </span>
                </div>
              </div>
            </div>

            {/* ---------- Pied fixe : bouton (toujours visible, au-dessus de la barre iPhone) ---------- */}
            <div className="shrink-0 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-5 bg-white">
              {error && <p className="mb-3 text-sm text-[#FF4545]">{error}</p>}
              <button
                type="button"
                onClick={submit}
                className="w-full bg-action hover:bg-[#B8141F] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2.5 active:scale-[0.99]"
              >
                <ShoppingCart size={20} />
                Ajouter au panier
                {totalQty > 0 && <> · {formatPrice(unitPrice * totalQty)}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Portail : la fenêtre est rendue dans <body>, hors de la carte produit. Un parent avec
  // transform/overflow (ex. `active:scale-95`) peut sinon la couper ou décaler son `fixed`.
  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}