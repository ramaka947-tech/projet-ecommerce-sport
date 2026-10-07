'use client';

import { useCart } from '@/lib/cart-context';
import Link from 'next/link';
import BackButton from './back-button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-4">Panier</h1>
        <p className="text-gray-500">Votre panier est vide.</p>
        <div className="mt-4 flex gap-3">
          <BackButton />
          <Link href="/boutique" className="text-sm underline self-center">
            Voir la boutique
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Panier</h1>
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="max-w-2xl space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 border rounded-lg p-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-20 rounded bg-gray-100 overflow-hidden shrink-0">
                {item.image && (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500">{item.price} € / unité</p>
                {(item.color || item.size) && (
                  <p className="mt-1 text-sm text-gray-700">
                    {item.color && <span>Couleur : {item.color}</span>}
                    {item.color && item.size && <span className="mx-2 text-gray-300">|</span>}
                    {item.size && <span>Taille : {item.size}</span>}
                  </p>
                )}
                {item.note && (
                  <p className="mt-1 text-xs text-gray-500 italic">Précision : {item.note}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 border rounded hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 border rounded hover:bg-gray-100 disabled:opacity-30"
              >
                +
              </button>

              <button
                onClick={() => removeItem(item.id)}
                className="ml-4 text-sm text-red-500 hover:underline"
              >
                Supprimer
              </button>
            </div>

            <div className="w-24 text-right font-semibold">
              {(item.price * item.quantity).toFixed(2)} €
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-2xl mt-8 border-t pt-4 flex justify-between items-center">
        <span className="text-lg font-semibold">
          Sous-total : {subtotal.toFixed(2)} €
        </span>
        <Link
          href="/commande"
          className="bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Passer la commande
        </Link>
      </div>
    </main>
  );
}