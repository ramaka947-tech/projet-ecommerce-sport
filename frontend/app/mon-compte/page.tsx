'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getMyOrders } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export default function AccountPage() {
  const router = useRouter();
  const { customer, isLoggedIn, logout } = useCustomerAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn) router.push('/compte/connexion');
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn) getMyOrders().then(setOrders).catch(() => {});
  }, [isLoggedIn]);

  if (!customer) return null;

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mon compte</h1>

      <div className="border rounded-lg p-6 space-y-2 mb-8">
        <p><strong>Nom :</strong> {customer.name}</p>
        <p><strong>Email :</strong> {customer.email}</p>
        <p><strong>Téléphone :</strong> {customer.phone}</p>
        {customer.country && <p><strong>Pays :</strong> {customer.country}</p>}
        {customer.region && <p><strong>Région :</strong> {customer.region}</p>}
        {customer.district && <p><strong>Quartier :</strong> {customer.district}</p>}
      </div>

      <h2 className="text-2xl font-bold mb-4">Mes commandes</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">Aucune commande pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/confirmation/${o.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold">{o.orderNumber}</span>
                <span className="text-sm">{STATUS_LABELS[o.status]}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                <span>{o.total.toFixed(2)} €</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={() => { logout(); router.push('/'); }}
        className="mt-8 text-red-500 hover:underline"
      >
        Se déconnecter
      </button>
    </main>
  );
}