'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '@/lib/admin-guard';
import { getOrderById } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(id)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AdminGuard><p>Chargement...</p></AdminGuard>;
  if (!order) return <AdminGuard><p>Commande introuvable.</p></AdminGuard>;

  return (
    <AdminGuard>
      <Link href="/admin/commandes" className="text-blue-400 hover:underline text-sm">
        ← Retour aux commandes
      </Link>

      <div className="flex justify-between items-center mt-4 mb-8">
        <h1 className="text-3xl font-bold">Commande {order.orderNumber}</h1>
        <span className="text-sm border rounded-full px-3 py-1">
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
        <div className="border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Client</h2>
          <p><strong>Nom :</strong> {order.customerName}</p>
          <p><strong>Téléphone :</strong> {order.customerPhone}</p>
          <p><strong>Adresse :</strong> {order.customerAddress}</p>
          <p><strong>Ville :</strong> {order.city}</p>
          {order.comment && <p className="mt-2"><strong>Commentaire :</strong> {order.comment}</p>}
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Informations</h2>
          <p><strong>Date :</strong> {new Date(order.createdAt).toLocaleString('fr-FR')}</p>
          <p><strong>Paiement :</strong> {order.paymentMethod === 'cash' ? 'À la livraison' : order.paymentMethod}</p>
        </div>
      </div>

      <div className="border rounded-lg p-6 mt-8 max-w-4xl">
        <h2 className="font-semibold mb-4">Articles</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="pb-2">Produit</th>
              <th className="pb-2">Prix unitaire</th>
              <th className="pb-2">Quantité</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">{item.product?.name || 'Produit supprimé'}</td>
                <td className="py-3">{item.unitPrice.toFixed(2)} €</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">
                  {(item.unitPrice * item.quantity).toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{order.subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span>Livraison</span>
            <span>{order.deliveryFee.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2">
            <span>Total</span>
            <span>{order.total.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}