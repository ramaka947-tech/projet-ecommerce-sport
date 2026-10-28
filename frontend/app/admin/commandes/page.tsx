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

const STATUS_BAR_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500',
  CONFIRMED: 'bg-purple-500',
  PREPARING: 'bg-amber-500',
  TO_DELIVER: 'bg-orange-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-action',
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
    if (!confirm(`Changer le statut en "${STATUS_LABELS[status]}" ?`)) return;
    try {
      await updateOrderStatus(id, status);
      load();
    } catch (e: any) {
      alert(e.message || "Erreur lors du changement de statut");
    }
  };

  const totalOrders = orders.length;
  const newOrders = orders.filter(o => o.status === 'NEW').length;
  const pendingOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.total, 0);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
    const matchesStatus = filterStatus ? o.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPage = (n: number) => {
    setPage(Math.min(Math.max(1, n), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    XLSX.writeFile(wb, `ad-sport-solutions_commandes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const selectStatusCls =
    'min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-semibold focus:outline-none focus:border-action md:min-h-0 md:w-auto md:py-2';

  return (
    <AdminGuard>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-bold text-ink md:text-2xl">Commandes</h1>
        <p className="mt-1 text-sm text-ink/60">Gérez les commandes de vos clients.</p>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-line bg-white p-4 shadow-sm md:p-5">
          <div className="mb-2 flex items-center gap-2 md:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action/10 text-action"><ShoppingCart size={16} /></div>
            <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">Commandes totales</p>
          </div>
          <p className="text-xl font-bold text-ink md:text-2xl">{totalOrders}</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm md:p-5">
          <div className="mb-2 flex items-center gap-2 md:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Clock size={16} /></div>
            <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">Nouvelles</p>
          </div>
          <p className="text-xl font-bold text-ink md:text-2xl">{newOrders}</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-4 shadow-sm md:p-5">
          <div className="mb-2 flex items-center gap-2 md:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><AlertCircle size={16} /></div>
            <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">À traiter</p>
          </div>
          <p className="text-xl font-bold text-ink md:text-2xl">{pendingOrders}</p>
        </div>

        <div className="col-span-2 rounded-xl border border-line bg-white p-4 shadow-sm md:p-5 lg:col-span-1">
          <div className="mb-2 flex items-center gap-2 md:gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"><DollarSign size={16} /></div>
            <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">CA (Livré)</p>
          </div>
          <p className="truncate text-lg font-bold text-ink md:text-xl">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Répartition */}
      <div className="mb-4 rounded-xl border border-line bg-white p-4 shadow-sm md:mb-6 md:p-5">
        <h2 className="mb-3 text-sm font-bold text-ink md:mb-4">Répartition des statuts</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:flex-row md:gap-6">
          {STATUS_OPTIONS.map(status => {
            const count = orders.filter(o => o.status === status).length;
            const percent = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
            if (count === 0 && status !== 'NEW') return null;
            return (
              <div key={status} className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-ink/70">{STATUS_LABELS[status]}</span>
                  <span className="shrink-0 text-ink/50">{count} ({percent}%)</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                  <div className={`h-full ${STATUS_BAR_COLORS[status]}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recherche & filtres */}
      <div className="flex flex-col gap-3 rounded-t-xl border border-b-0 border-line bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between md:gap-4 md:p-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Rechercher une commande, un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-line bg-canvas/30 pl-9 pr-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2 md:text-sm"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:w-auto md:gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectStatusCls}>
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <button onClick={handleExport} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-action hover:text-action md:min-h-0 md:py-2">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* Liste : cartes mobile / tableau desktop */}
      <div className="overflow-hidden rounded-b-xl border border-line bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12 text-ink/50"><Loader2 className="animate-spin" size={24} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-ink/50">Aucune commande trouvée.</div>
        ) : (
          <>
            {/* Mobile : cartes */}
            <ul className="divide-y divide-line md:hidden">
              {paginatedOrders.map(o => (
                <li key={o.id} className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <Link href={`/admin/commandes/${o.id}`} className="text-sm font-bold text-action hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="shrink-0 text-sm font-bold text-ink">{formatPrice(o.total)}</span>
                  </div>

                  <p className="text-sm font-medium text-ink">{o.customerName}</p>
                  <p className="text-xs text-ink/50">{o.customerPhone}</p>
                  <p className="mt-1 text-xs text-ink/50">
                    {new Date(o.createdAt).toLocaleDateString('fr-FR')} · {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {o.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-action-soft px-2.5 py-1 text-xs font-semibold text-action">
                        <Ban size={12} /> Annulée
                      </span>
                    ) : (
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`min-h-10 flex-1 rounded-lg border-transparent px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-action/20 ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s} disabled={s === 'CANCELLED'}>
                            {STATUS_LABELS[s]} {s === 'CANCELLED' ? '(via bouton)' : ''}
                          </option>
                        ))}
                      </select>
                    )}

                    {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleStatusChange(o.id, 'CANCELLED')}
                        aria-label="Annuler la commande"
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink/40 transition hover:bg-action-soft hover:text-action"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <Link
                      href={`/admin/commandes/${o.id}`}
                      aria-label="Voir le détail"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink/60 transition hover:bg-line hover:text-ink"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop : tableau */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-canvas/50 text-xs uppercase tracking-wider text-ink/60">
                    <th className="px-6 py-4 font-semibold">N° commande</th>
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Total</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paginatedOrders.map(o => (
                    <tr key={o.id} className="transition hover:bg-canvas/30">
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
                        {o.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-action-soft px-2.5 py-1 text-xs font-semibold text-action">
                            <Ban size={12} /> Annulée (définitif)
                          </span>
                        ) : (
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`cursor-pointer rounded-lg border-transparent px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-action/20 ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}
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
                          {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                            <button
                              onClick={() => handleStatusChange(o.id, 'CANCELLED')}
                              className="rounded-lg p-2 text-ink/40 transition hover:bg-action-soft hover:text-action"
                              title="Annuler la commande (remet le stock)"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                          <Link href={`/admin/commandes/${o.id}`} className="rounded-lg bg-canvas p-2 text-ink/50 transition hover:bg-line hover:text-ink" title="Voir le détail">
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-4">
          <span className="text-xs text-ink/50 md:text-sm">
            {paginatedOrders.length} sur {filtered.length} commandes
          </span>
          <div className="flex items-center justify-center gap-1">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Page précédente" className="flex size-10 items-center justify-center rounded-lg border border-line hover:bg-canvas disabled:opacity-30 md:size-auto md:p-2">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-sm font-semibold text-ink md:hidden">{currentPage} / {totalPages}</span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`hidden h-9 w-9 rounded-lg text-sm font-medium transition md:block ${currentPage === p ? 'bg-action text-white' : 'border border-line text-ink hover:bg-canvas'}`}
              >
                {p}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Page suivante" className="flex size-10 items-center justify-center rounded-lg border border-line hover:bg-canvas disabled:opacity-30 md:size-auto md:p-2">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}