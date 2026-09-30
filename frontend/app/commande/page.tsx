'use client';

import { useCart } from '@/lib/cart-context';
import { createOrder, getSettings } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const { customer, isLoggedIn } = useCustomerAuth();

  const [deliveryFee, setDeliveryFee] = useState(0);

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    city: '',
    comment: '',
    paymentMethod: 'cash',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => setDeliveryFee(Number(s.delivery_fee) || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || customer.name,
        customerPhone: f.customerPhone || customer.phone,
        city: f.city || customer.region || '',
      }));
    }
  }, [customer]);

  if (items.length === 0) {
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Commande</h1>
        <p className="text-gray-500">Votre panier est vide.</p>
        <button
          onClick={() => router.back()}
          className="text-blue-400 hover:underline mt-4 inline-block"
        >
          ← Retour au panier
        </button>
      </main>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const order = await createOrder({
        ...form,
        customerId: customer?.id,
        deliveryFee,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      clearCart();
      router.push(`/confirmation/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const total = subtotal + deliveryFee;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Finaliser la commande</h1>

      <button
        onClick={() => router.back()}
        className="text-blue-400 hover:underline mb-6"
      >
        ← Retour au panier
      </button>

      {!isLoggedIn && (
        <div className="mb-6 p-4 border rounded-lg text-sm max-w-4xl">
          <Link href="/compte/connexion" className="text-blue-400 hover:underline">
            Se connecter
          </Link>{' '}
          ou{' '}
          <Link href="/compte/inscription" className="text-blue-400 hover:underline">
            créer un compte
          </Link>{' '}
          pour retrouver vos commandes. Ou continuez en invité ci-dessous.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet</label>
            <input
              name="customerName"
              required
              value={form.customerName}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              name="customerPhone"
              required
              value={form.customerPhone}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input
              name="customerAddress"
              required
              value={form.customerAddress}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ville</label>
            <input
              name="city"
              required
              value={form.city}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Mode de paiement
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 bg-transparent"
            >
              <option value="cash" className="text-black">
                Paiement à la livraison
              </option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Envoi en cours...' : 'Confirmer la commande'}
          </button>
        </form>

        <div className="border rounded-lg p-6 h-fit">
          <h2 className="font-semibold mb-4">Récapitulatif</h2>
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between text-sm mb-2"
            >
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>{(item.price * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Livraison</span>
              <span>{deliveryFee} €</span>
            </div>
            <div className="flex justify-between font-semibold text-lg mt-2">
              <span>Total</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}