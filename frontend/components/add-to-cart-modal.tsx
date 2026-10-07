'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart-context';

// Accepte un tableau ["Rouge","Bleu"] ou une chaîne "Rouge, Bleu"
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

export default function AddToCartModal({
  product,
  onClose,
}: {
  product: any;
  onClose: () => void;
}) {
  const { addItem } = useCart();

  const colors = toList(product.colors);
  const sizes = toList(product.sizes);
  const stock: number = product.stock ?? 99;
  const unitPrice = Number(product.promoPrice || product.price);

  // Choix multiples (si le produit propose des options)
  const [pickedColors, setPickedColors] = useState<string[]>([]);
  const [pickedSizes, setPickedSizes] = useState<string[]>([]);
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

  const chosenColors = colors.length > 0 ? pickedColors : toList(colorText);
  const chosenSizes = sizes.length > 0 ? pickedSizes : toList(sizeText);

  // Une ligne de panier par combinaison couleur × taille
  const combos = useMemo(() => {
    const cs = chosenColors.length > 0 ? chosenColors : [''];
    const ss = chosenSizes.length > 0 ? chosenSizes : [''];
    return cs.flatMap((c) =>
      ss.map((s) => ({
        key: `${c}|${s}`,
        color: c || undefined,
        size: s || undefined,
      }))
    );
  }, [chosenColors.join('|'), chosenSizes.join('|')]);

  const getQty = (key: string) => quantities[key] ?? 1;
  const setQty = (key: string, q: number) =>
    setQuantities((prev) => ({ ...prev, [key]: Math.max(1, Math.min(stock, q)) }));

  const totalQty = combos.reduce((sum, c) => sum + getQty(c.key), 0);

  function submit() {
    if (colors.length > 0 && pickedColors.length === 0)
      return setError('Choisissez au moins une couleur.');
    if (sizes.length > 0 && pickedSizes.length === 0)
      return setError('Choisissez au moins une taille.');

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

  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
    }`;

  const input =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500';

  const hint = <span className="font-normal text-gray-400">(plusieurs choix possibles)</span>;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
        >
          ✕
        </button>

        {/* En-tête produit */}
        <div className="flex gap-4 p-5 border-b border-gray-100">
          <div className="w-20 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0">
            {product.images?.[0] && (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="pr-8">
            <p className="font-semibold text-gray-900 line-clamp-2">{product.name}</p>
            <p className="mt-1 font-bold text-gray-900">
              {unitPrice.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>

        {addedCount > 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">
              ✓
            </div>
            <p className="mt-3 font-semibold">
              {addedCount > 1 ? `${addedCount} variantes ajoutées` : 'Ajouté'} au panier
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Continuer mes achats
              </button>
              <Link
                href="/panier"
                className="flex-1 text-center bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-800"
              >
                Voir le panier
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Couleurs */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Couleurs {colors.length > 0 && <span className="text-red-500">*</span>} {hint}
              </p>
              {colors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setPickedColors((l) => toggle(l, c)); setError(''); }}
                      className={chip(pickedColors.includes(c))}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  value={colorText}
                  onChange={(e) => setColorText(e.target.value)}
                  placeholder="Ex : Noir, Blanc"
                  className={input}
                />
              )}
            </div>

            {/* Tailles */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Tailles {sizes.length > 0 && <span className="text-red-500">*</span>} {hint}
              </p>
              {sizes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setPickedSizes((l) => toggle(l, s)); setError(''); }}
                      className={chip(pickedSizes.includes(s))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  value={sizeText}
                  onChange={(e) => setSizeText(e.target.value)}
                  placeholder="Ex : M, L, 42"
                  className={input}
                />
              )}
            </div>

            {/* Quantité par combinaison */}
            <div>
              <p className="text-sm font-semibold mb-2">Quantité</p>
              <div className="space-y-2">
                {combos.map((c) => {
                  const label = [c.color, c.size].filter(Boolean).join(' · ');
                  const q = getQty(c.key);
                  return (
                    <div
                      key={c.key}
                      className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm text-gray-700 truncate">
                        {label || 'Quantité'}
                      </span>
                      <div className="inline-flex items-center border border-gray-200 rounded-lg shrink-0">
                        <button
                          type="button"
                          onClick={() => setQty(c.key, q - 1)}
                          disabled={q <= 1}
                          className="w-8 h-8 hover:bg-gray-50 disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{q}</span>
                        <button
                          type="button"
                          onClick={() => setQty(c.key, q + 1)}
                          disabled={q >= stock}
                          className="w-8 h-8 hover:bg-gray-50 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Autre précision */}
            <div>
              <p className="text-sm font-semibold mb-2">
                Précision <span className="font-normal text-gray-400">(facultatif)</span>
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Flocage, message pour le vendeur…"
                className={input}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              className="w-full bg-gray-900 hover:bg-yellow-500 hover:text-black text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Ajouter au panier · {(unitPrice * totalQty).toLocaleString('fr-FR')} €
            </button>
          </div>
        )}
      </div>
    </div>
  );
}