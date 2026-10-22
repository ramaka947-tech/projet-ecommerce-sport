'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getOrders, updateOrderStatus } from '@/lib/api';
import Link from 'next/link';
import { Loader2, Search, ChevronRight } from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Commandes</h1>
          <p className="text-sm text-ink/60">Gérez les commandes de vos clients.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink/50">
          <Loader2 className="animate-spin" size={18} /> Chargement...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-line rounded-xl p-12 text-center text-ink/50">
          Aucune commande pour le moment.
        </div>
      ) : (
        <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas text-ink/60 text-xs uppercase tracking-wider">
                  <th className="px-5 py-4 font-semibold">N° commande</th>
                  <th className="px-5 py-4 font-semibold">Client</th>
                  <th className="px-5 py-4 font-semibold">Total</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-canvas/50 transition">
                    <td className="px-5 py-4">
                      <Link href={`/admin/commandes/${o.id}`} className="font-semibold text-action hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{o.customerName}</p>
                      <p className="text-xs text-ink/50">{o.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-ink">
                      {Number(o.total).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-5 py-4 text-sm text-ink/60">
                      {new Date(o.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="border border-line rounded-lg px-3 py-1.5 bg-white text-sm font-medium focus:ring-2 focus:ring-action/20 focus:border-action outline-none cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/commandes/${o.id}`} className="inline-flex p-2 text-ink/40 hover:text-action hover:bg-action/5 rounded-lg transition">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}