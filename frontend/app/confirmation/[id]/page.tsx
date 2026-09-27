import { getOrderById } from '@/lib/api';
import Link from 'next/link';

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  return (
    <main className="min-h-screen p-8 flex flex-col items-center text-center">
      <div className="mt-16 max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          ✓ Commande confirmée
        </h1>
        <p className="text-gray-500 mb-6">
          Merci {order.customerName}, votre commande a bien été enregistrée.
        </p>

        <div className="border rounded-lg p-6 text-left">
          <p className="font-semibold">Numéro de commande</p>
          <p className="text-lg mb-4">{order.orderNumber}</p>

          <p className="font-semibold">Total</p>
          <p className="text-lg mb-4">{order.total.toFixed(2)} €</p>

          <p className="font-semibold">Livraison</p>
          <p>
            {order.customerAddress}, {order.city}
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Retour au catalogue
        </Link>
      </div>
    </main>
  );
}