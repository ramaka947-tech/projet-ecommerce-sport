'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getOrders, getProducts } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelles',
  CONFIRMED: 'Confirmées',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrées',
  CANCELLED: 'Annulées',
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOrders(), getProducts()]).then(([o, p]) => {
      setOrders(o);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AdminGuard>
        <p className="text-gray-500">Chargement...</p>
      </AdminGuard>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  const today = new Date().toDateString();
  const revenueToday = orders
    .filter(
      (o) =>
        o.status !== 'CANCELLED' &&
        new Date(o.createdAt).toDateString() === today,
    )
    .reduce((sum, o) => sum + o.total, 0);

  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">CA total</p>
          <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">CA aujourd'hui</p>
          <p className="text-2xl font-bold">{revenueToday.toFixed(2)} €</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Commandes</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Produits</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-4">Commandes par statut</h2>
          <div className="space-y-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="flex justify-between border-b pb-2 text-sm"
              >
                <span>{label}</span>
                <span className="font-semibold">
                  {statusCounts[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-4">
            Stock faible ({lowStock.length})
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun produit en stock faible.
            </p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span>{p.name}</span>
                  <span className="font-semibold text-red-500">
                    {p.stock} en stock
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}