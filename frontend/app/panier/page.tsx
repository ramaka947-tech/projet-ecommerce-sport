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
        <div className="mt-4">
          <BackButton />
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
            key={item.productId}
            className="flex items-center justify-between border rounded-lg p-4"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">{item.price} € / unité</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-8 h-8 border rounded hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
                className="w-8 h-8 border rounded hover:bg-gray-100 disabled:opacity-30"
              >
                +
              </button>

              <button
                onClick={() => removeItem(item.productId)}
                className="ml-4 text-sm text-red-500 hover:underline"
              >
                Supprimer
              </button>
            </div>

            <div className="w-20 text-right font-semibold">
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