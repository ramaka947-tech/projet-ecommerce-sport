'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminGuard from '@/lib/admin-guard';
import { getOrderById, updateOrderStatus } from '@/lib/api';
import { 
  ArrowLeft, MapPin, Phone, User, Calendar, CreditCard, XCircle, 
  CheckCircle2, LayoutGrid, Image as ImageIcon, Loader2 
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  TO_DELIVER: 'À livrer',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-purple-100 text-purple-800',
  PREPARING: 'bg-amber-100 text-amber-800',
  TO_DELIVER: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-success-soft text-success',
  CANCELLED: 'bg-action-soft text-action',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

const fcfa = (n: number) => `${Number(n).toLocaleString('fr-FR')} FCFA`;

// Vraie icône SVG WhatsApp
const WhatsAppIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// Vraie icône SVG Wave
const WaveIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DC3F3" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.626 14.865c-.346 1.378-1.687 2.38-3.144 2.38-1.922 0-3.48-1.558-3.48-3.48V9.348c0-.585-.475-1.06-1.06-1.06s-1.06.475-1.06 1.06v3.174a.86.86 0 01-1.72 0V9.348c0-1.533 1.247-2.78 2.78-2.78s2.78 1.247 2.78 2.78v4.417c0 1.052.853 1.905 1.905 1.905.847 0 1.576-.56 1.817-1.354.102-.335.465-.515.8-.413.336.102.515.465.413.8z"/>
  </svg>
);

function BackLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="mb-6 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-action hover:text-action"
    >
      <ArrowLeft className="h-4 w-4" /> Retour aux commandes
    </button>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    getOrderById(id).then(setOrder).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Changer le statut en "${STATUS_LABELS[newStatus]}" ?`)) return;
    setUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      load();
    } catch (e: any) {
      alert(e.message || "Erreur lors du changement de statut");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <AdminGuard><div className="p-8 flex justify-center"><Loader2 className="animate-spin text-action" /></div></AdminGuard>;
  if (!order) return <AdminGuard><div className="p-8 text-action">Commande introuvable.</div></AdminGuard>;

  const whatsappUrl = `https://wa.me/${String(order.customerPhone).replace(/\D/g, '')}`;

  return (
    <AdminGuard>
      <BackLink />

      {/* En-tête avec Titre et Changement de Statut */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
            Commande {order.orderNumber}
          </h1>
          <p className="text-sm text-ink/60 mt-1">Détails et historique de la commande.</p>
        </div>
        
        {/* Menu de changement de statut intégré */}
        <div className="flex items-center gap-3">
          {order.status === 'CANCELLED' ? (
            <span className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-action-soft text-action">
              <XCircle size={18} /> Annulée (définitif)
            </span>
          ) : (
            <div className="flex items-center gap-2">
              {updating && <Loader2 size={18} className="animate-spin text-action" />}
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-action/20 cursor-pointer border-none shadow-sm ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} disabled={s === 'CANCELLED'}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        
        {/* Carte Client */}
        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg text-ink flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><User size={18} /></div>
            Informations client
          </h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <User size={18} className="text-ink/40" />
              <span className="font-semibold text-ink text-base">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-ink/40" />
              <a href={`tel:${order.customerPhone}`} className="text-ink hover:underline">{order.customerPhone}</a>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-ink/40 mt-0.5 shrink-0" />
              <span className="text-ink">{order.customerAddress}, {order.city}</span>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-6 bg-[#25D366] text-white font-bold rounded-xl px-4 py-3 hover:bg-[#20bd5a] transition shadow-sm"
            >
              <WhatsAppIcon size={20} /> Contacter sur WhatsApp
            </a>
          </div>
        </div>

        {/* Carte Infos & Timeline */}
        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg text-ink flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><Calendar size={18} /></div>
            Informations commande
          </h2>
          
          <div className="space-y-4 text-sm mb-8">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-ink/60"><Calendar size={16} /> Date de commande</span>
              <span className="font-medium text-ink">{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 text-ink/60"><CreditCard size={16} /> Paiement</span>
              <span className="font-medium text-ink flex items-center gap-2 capitalize">
                {order.paymentMethod === 'wave' && <WaveIcon size={18} />}
                {order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Timeline de l'historique */}
          {order.history?.length > 0 && (
            <div className="border-t border-line pt-5">
              <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">Historique</h3>
              <div className="space-y-0">
                {[...order.history].reverse().map((h: any, i: number, arr: any[]) => {
                  const isLast = i === arr.length - 1;
                  const isCurrent = i === 0;
                  const isCancelled = h.status === 'CANCELLED';
                  return (
                    <div key={h.id} className="flex gap-4 min-h-[50px]">
                      {/* Ligne et ronds */}
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${isCancelled ? 'bg-action/10 text-action' : isCurrent ? 'bg-action text-white' : 'bg-canvas border border-line text-ink/30'}`}>
                          {isCancelled ? <XCircle size={14} /> : isCurrent ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-ink/20" />}
                        </div>
                        {!isLast && <div className="w-px h-full bg-line border-l border-dashed my-1" />}
                      </div>
                      
                      {/* Texte */}
                      <div className="pb-5">
                        <p className={`font-semibold text-sm ${isCancelled ? 'text-action' : isCurrent ? 'text-ink' : 'text-ink/60'}`}>
                          {h.status === 'CANCELLED' ? 'Commande annulée' : STATUS_LABELS[h.status]}
                        </p>
                        <p className="text-xs text-ink/40">{new Date(h.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Carte Articles */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg text-ink flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-action text-white flex items-center justify-center"><LayoutGrid size={18} /></div>
          Articles commandés
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas/50 text-ink/50 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold rounded-l-lg">Produit</th>
                <th className="px-4 py-3 font-semibold text-center">Taille / Couleur</th>
                <th className="px-4 py-3 font-semibold text-right">Prix unitaire</th>
                <th className="px-4 py-3 font-semibold text-center">Quantité</th>
                <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item: any) => {
                const name = item.productName || item.product?.name || 'Produit supprimé';
                const image = item.productImage || item.product?.images?.[0];
                return (
                  <tr key={item.id} className="hover:bg-canvas/30 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-lg bg-canvas border border-line shrink-0 overflow-hidden flex items-center justify-center">
                          {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-ink/20" />}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <p className="text-sm text-ink/60">
                        {item.color || 'Aucune'} / {item.size || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">{fcfa(item.unitPrice)}</td>
                    <td className="px-4 py-4 text-center text-sm font-medium">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-sm font-bold text-ink">{fcfa(item.unitPrice * item.quantity)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="border-t border-line mt-6 pt-6 space-y-3 text-sm w-full max-w-xs ml-auto">
          <div className="flex justify-between text-ink/60">
            <span>Sous-total</span>
            <span className="font-medium text-ink">{fcfa(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Frais de livraison</span>
            <span className="font-medium text-ink">{fcfa(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-line text-ink">
            <span>Total</span>
            <span>{fcfa(order.total)}</span>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}