'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '@/lib/admin-guard';
import { getOrders, updateOrderStatus } from '@/lib/api';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  Search, Loader2, Download, Eye, ChevronLeft, ChevronRight,
  ShoppingCart, Clock, AlertCircle, DollarSign, Ban, CheckCircle2
} from 'lucide-react';
import { useCurrency } from '@/lib/currency';

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
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-action-soft text-action',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
const ITEMS_PER_PAGE = 10;

export default function AdminOrdersPage() {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, filterStatus]);

  const handleStatusChange = async (id: string, status: string) => {
    // Si l'admin essaie de changer une commande déjà annulée, on bloque (sauf si on veut forcer)
    if (!confirm(`Changer le statut en "${STATUS_LABELS[status]}" ?`)) return;

    try {
      await updateOrderStatus(id, status);
      load();
    } catch (e: any) {
      alert(e.message || "Erreur lors du changement de statut");
    }
  };

  // --- STATISTIQUES ---
  const totalOrders = orders.length;
  const newOrders = orders.filter(o => o.status === 'NEW').length;
  const pendingOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0);

  // --- FILTRAGE ---
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
    const matchesStatus = filterStatus ? o.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  // --- PAGINATION ---
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (n: number) => {
    setPage(Math.min(Math.max(1, n), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- EXPORT EXCEL ---
  const handleExport = () => {
    const excelData = filtered.map(o => ({
      "N° Commande": o.orderNumber,
      "Client": o.customerName,
      "Téléphone": o.customerPhone,
      "Ville": o.city,
      "Adresse": o.customerAddress,
      "Total (FCFA)": o.total,
      "Statut": STATUS_LABELS[o.status] || o.status,
      "Date": new Date(o.createdAt).toLocaleDateString('fr-FR'),
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");
    XLSX.writeFile(wb, `export_commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <AdminGuard>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Commandes</h1>
          <p className="text-sm text-ink/60 mt-1">Gérez les commandes de vos clients.</p>
        </div>
      </div>

      {/* --- CARTES STATISTIQUES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-action/10 text-action flex items-center justify-center"><ShoppingCart size={16} /></div>
            <p className="text-sm font-semibold text-ink/60">Commandes totales</p>
          </div>
          <p className="text-2xl font-bold text-ink">{totalOrders}</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Clock size={16} /></div>
            <p className="text-sm font-semibold text-ink/60">Nouvelles</p>
          </div>
          <p className="text-2xl font-bold text-ink">{newOrders}</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><AlertCircle size={16} /></div>
            <p className="text-sm font-semibold text-ink/60">À traiter</p>
          </div>
          <p className="text-2xl font-bold text-ink">{pendingOrders}</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center"><DollarSign size={16} /></div>
            <p className="text-sm font-semibold text-ink/60">Chiffre d'affaires (Livré)</p>
          </div>
          <p className="text-xl font-bold text-ink">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* --- RÉPARTITION DES STATUTS --- */}
      <div className="bg-white border border-line rounded-xl p-5 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-ink mb-4">Répartition des statuts</h2>
        <div className="flex flex-col md:flex-row gap-6">
          {STATUS_OPTIONS.map(status => {
            const count = orders.filter(o => o.status === status).length;
            const percent = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
            if (count === 0 && status !== 'NEW') return null; // On cache les statuts vides
            return (
              <div key={status} className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-ink/70">{STATUS_LABELS[status]}</span>
                  <span className="text-ink/50">{count} ({percent}%)</span>
                </div>
                <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                  <div className={`h-full ${STATUS_COLORS[status].split(' ')[0].replace('-100', '-500')}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- BARRE DE RECHERCHE & FILTRES --- */}
      <div className="bg-white border border-line rounded-t-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b-0 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Rechercher une commande, un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-action bg-canvas/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-line rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-action"
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <button onClick={handleExport} className="inline-flex items-center gap-2 border border-line bg-white px-4 py-2 rounded-lg text-sm font-semibold text-ink hover:border-action hover:text-action transition">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* --- TABLEAU --- */}
      <div className="bg-white border border-line shadow-sm overflow-hidden rounded-b-xl">
        {loading ? (
          <div className="p-12 flex justify-center text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-ink/50">Aucune commande trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-canvas/50 text-ink/60 text-xs uppercase tracking-wider border-b border-line">
                  <th className="px-6 py-4 font-semibold">N° commande</th>
                  <th className="px-6 py-4 font-semibold">Client</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Statut</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedOrders.map(o => (
                  <tr key={o.id} className="hover:bg-canvas/30 transition">
                    <td className="px-6 py-4">
                      <Link href={`/admin/commandes/${o.id}`} className="font-bold text-action hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-ink">{o.customerName}</p>
                      <p className="text-xs text-ink/50">{o.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-ink">{formatPrice(o.total)}</td>
                    <td className="px-6 py-4 text-sm text-ink/60">
                      {new Date(o.createdAt).toLocaleDateString('fr-FR')} <br />
                      <span className="text-xs">{new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      {/* On désactive le select si la commande est déjà annulée */}
                      {o.status === 'CANCELLED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-action-soft text-action">
                          <Ban size={12} /> Annulée (définitif)
                        </span>
                      ) : (
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-action/20 cursor-pointer ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'} border-transparent`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} disabled={s === 'CANCELLED'}>
                              {STATUS_LABELS[s]} {s === 'CANCELLED' ? '(via bouton)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton d'annulation réservé à l'admin */}
                        {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'CANCELLED')}
                            className="p-2 text-ink/40 hover:text-action hover:bg-action-soft rounded-lg transition"
                            title="Annuler la commande (remet le stock)"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                        <Link href={`/admin/commandes/${o.id}`} className="p-2 text-ink/50 hover:text-ink bg-canvas hover:bg-line rounded-lg transition" title="Voir le détail">
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- PAGINATION --- */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center bg-white border border-line p-4 rounded-xl shadow-sm">
          <span className="text-sm text-ink/50">Affichage de {paginatedOrders.length} commandes sur {filtered.length}</span>
          <div className="flex gap-1">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-line rounded-lg hover:bg-canvas disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${currentPage === p ? 'bg-action text-white' : 'border border-line hover:bg-canvas text-ink'}`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-line rounded-lg hover:bg-canvas disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}