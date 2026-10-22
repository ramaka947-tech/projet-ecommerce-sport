'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminGuard from '@/lib/admin-guard';
import { getOrderById } from '@/lib/api';
import { ArrowLeft, MessageCircle, MapPin, Phone, User, Calendar, CreditCard, Clock } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-amber-100 text-amber-800',
  TO_DELIVER: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-success-soft text-success',
  CANCELLED: 'bg-action-soft text-action',
};

const fcfa = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

function renderComment(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" className="text-action underline hover:text-action-dark">
        Voir sur la carte
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function BackLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="mb-6 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour aux commandes
    </button>
  );
}

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

  if (loading) return <AdminGuard><div className="p-8 text-ink/50">Chargement...</div></AdminGuard>;
  if (!order) return <AdminGuard><div className="p-8 text-action">Commande introuvable.</div></AdminGuard>;

  const whatsappUrl = `https://wa.me/${String(order.customerPhone).replace(/\D/g, '')}`;

  return (
    <AdminGuard>
      <BackLink />

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-3">
            Commande {order.orderNumber}
          </h1>
          <p className="text-sm text-ink/60 mt-1">Détails et historique de la commande.</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        
        {/* Carte Client */}
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-ink flex items-center gap-2 mb-4 border-b border-line pb-3">
            <User size={18} className="text-action" /> Informations Client
          </h2>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2"><strong>Nom :</strong> {order.customerName}</p>
            <p className="flex items-center gap-2"><Phone size={16} className="text-ink/40" /> <a href={`tel:${order.customerPhone}`} className="hover:underline">{order.customerPhone}</a></p>
            <p className="flex items-start gap-2"><MapPin size={16} className="text-ink/40 mt-0.5 shrink-0" /> {order.customerAddress}, {order.city}</p>
            
            {order.comment && (
              <div className="mt-4 p-3 bg-canvas rounded-lg text-ink/80">
                <strong>Note :</strong> {renderComment(order.comment)}
              </div>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full mt-4 bg-[#25D366] text-white font-semibold rounded-lg px-4 py-2.5 hover:opacity-90 transition"
            >
              <MessageCircle size={18} /> Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Carte Infos */}
        <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
          <h2 className="font-bold text-ink flex items-center gap-2 mb-4 border-b border-line pb-3">
            <Calendar size={18} className="text-action" /> Informations Commande
          </h2>
          <div className="space-y-3 text-sm mb-6">
            <p className="flex items-center gap-2"><strong>Date :</strong> {new Date(order.createdAt).toLocaleString('fr-FR')}</p>
            <p className="flex items-center gap-2"><CreditCard size={16} className="text-ink/40" /> <strong>Paiement :</strong> {order.paymentMethod === 'cash' ? 'À la livraison' : order.paymentMethod}</p>
          </div>

          {order.history?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line">
              <h3 className="font-semibold text-ink mb-3 flex items-center gap-2"><Clock size={16} /> Historique</h3>
              <div className="space-y-3 text-sm">
                {[...order.history].reverse().map((h: any) => (
                  <div key={h.id} className="flex justify-between items-center gap-4">
                    <span className="font-medium text-ink">{STATUS_LABELS[h.status] || h.status}</span>
                    <span className="text-xs text-ink/50 text-right">{new Date(h.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carte Articles */}
      <div className="bg-white border border-line rounded-xl p-6 shadow-sm max-w-4xl">
        <h2 className="font-bold text-ink mb-4 border-b border-line pb-3">Articles commandés</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-ink/50 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Produit</th>
                <th className="pb-3 font-semibold text-right">Prix unitaire</th>
                <th className="pb-3 font-semibold text-center">Qté</th>
                <th className="pb-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item: any) => {
                const name = item.productName || item.product?.name || 'Produit supprimé';
                const image = item.productImage || item.product?.images?.[0];
                return (
                  <tr key={item.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {image && (
                          <img src={image} alt={name} className="w-12 h-12 rounded-lg object-cover border border-line" />
                        )}
                        <div>
                          <p className="font-semibold text-ink">{name}</p>
                          <p className="text-xs text-ink/50">
                            {item.size ? `Taille : ${item.size}` : 'Taille : -'}
                            {' · '}
                            {item.color ? `Couleur : ${item.color}` : 'Couleur : -'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right text-sm">{fcfa(item.unitPrice)}</td>
                    <td className="py-4 text-center text-sm font-medium">{item.quantity}</td>
                    <td className="py-4 text-right text-sm font-bold text-ink">{fcfa(item.unitPrice * item.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between text-ink/70">
            <span>Sous-total</span>
            <span>{fcfa(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/70">
            <span>Livraison</span>
            <span>{fcfa(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-2 text-ink">
            <span>Total</span>
            <span>{fcfa(order.total)}</span>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}