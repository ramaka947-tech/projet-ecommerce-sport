'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getOrders, updateOrderStatus } from '@/lib/api';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    load();
  };

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Commandes</h1>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">Aucune commande pour le moment.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-2">N° commande</th>
              <th className="pb-2">Client</th>
              <th className="pb-2">Téléphone</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-3">
                  <Link href={`/admin/commandes/${o.id}`} className="text-blue-400 hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-3">{o.customerName}</td>
                <td className="py-3">{o.customerPhone}</td>
                <td className="py-3">{o.total.toFixed(2)} €</td>
                <td className="py-3 text-sm text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="py-3">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    className="border rounded-lg px-2 py-1 bg-transparent text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="text-black">
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminGuard>
  );
}