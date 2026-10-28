'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import { Loader2, TrendingUp, ShoppingCart, ShoppingBag, Package, Search, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { getStats } from '@/lib/api';
import { useCurrency } from '@/lib/currency';

const PERIODS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'all', label: 'Toutes périodes' },
];

const ITEMS_PER_PAGE = 5;

export default function StatsPage() {
  const { formatPrice } = useCurrency();
  const [period, setPeriod] = useState('30d');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getStats(period)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    setPage(1);
  }, [search, period]);

  if (loading || !stats) {
    return (
      <AdminGuard>
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-action" size={32} /></div>
      </AdminGuard>
    );
  }

  const filteredProducts = stats.topProducts.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <AdminGuard>
      {/* En-tête */}
      <div className="mb-4 flex flex-col gap-3 md:mb-8 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink md:text-2xl">Statistiques</h1>
          <p className="mt-1 text-sm text-ink/60">Suivez les performances de votre boutique en temps réel.</p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 xl:mx-0 xl:px-0 xl:pb-0 [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex gap-1.5 rounded-xl border border-line bg-white p-1.5 shadow-sm">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition md:text-sm ${period === p.value
                  ? 'bg-action text-white shadow-sm'
                  : 'text-ink/60 hover:bg-canvas hover:text-ink'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* KPI : 2 colonnes mobile */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
            <div className="mb-2 flex items-center gap-2 md:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action/10 text-action md:size-10"><TrendingUp size={18} className="md:hidden" /><TrendingUp size={20} className="hidden md:block" /></div>
              <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">CA</p>
            </div>
            <p className="truncate text-lg font-bold text-ink md:text-2xl">{formatPrice(stats.revenue)}</p>
          </div>

          <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
            <div className="mb-2 flex items-center gap-2 md:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 md:size-10"><ShoppingCart size={18} className="md:hidden" /><ShoppingCart size={20} className="hidden md:block" /></div>
              <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">Commandes</p>
            </div>
            <p className="text-lg font-bold text-ink md:text-2xl">{stats.orderCount}</p>
          </div>

          <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
            <div className="mb-2 flex items-center gap-2 md:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success md:size-10"><CheckCircle2 size={18} className="md:hidden" /><CheckCircle2 size={20} className="hidden md:block" /></div>
              <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">Livrées</p>
            </div>
            <p className="text-lg font-bold text-ink md:text-2xl">{stats.deliveredCount}</p>
          </div>

          <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
            <div className="mb-2 flex items-center gap-2 md:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 md:size-10"><ShoppingBag size={18} className="md:hidden" /><ShoppingBag size={20} className="hidden md:block" /></div>
              <p className="truncate text-xs font-semibold text-ink/60 md:text-sm">Panier moyen</p>
            </div>
            <p className="truncate text-lg font-bold text-ink md:text-2xl">{formatPrice(stats.avgOrder)}</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid gap-4 md:gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-6">
            <h2 className="mb-3 text-sm font-bold text-ink md:mb-6 md:text-base">Évolution du CA</h2>
            <div className="h-[220px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenueSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={48} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                  <Tooltip formatter={(v: any) => formatPrice(v)} labelStyle={{ color: '#0A0A0A' }} />
                  <Line type="monotone" dataKey="value" stroke="#E11D2E" strokeWidth={2.5} dot={{ r: 3, fill: '#E11D2E' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-6">
            <h2 className="mb-3 text-sm font-bold text-ink md:mb-6 md:text-base">Ventes par catégorie</h2>
            <div className="h-[220px] md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categorySeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={8} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} width={48} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                  <Tooltip formatter={(v: any) => formatPrice(v)} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#E11D2E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top produits */}
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-line p-3 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink text-white"><Package size={16} /></div>
              <h2 className="text-sm font-bold text-ink md:text-base">Top des produits vendus</h2>
            </div>

            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-line bg-canvas/30 pl-9 pr-3 text-base focus:border-action focus:outline-none md:min-h-0 md:py-2 md:text-sm"
              />
            </div>
          </div>

          {/* Mobile : cartes */}
          <ul className="divide-y divide-line md:hidden">
            {paginatedProducts.map((p: any, i: number) => (
              <li key={i} className="flex items-center gap-3 p-3">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="size-12 shrink-0 rounded-lg border border-line object-cover" />
                ) : (
                  <div className="size-12 shrink-0 rounded-lg border border-line bg-canvas" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink/50">Qté vendue : <span className="font-bold text-ink/70">{p.quantity}</span></p>
                </div>
                <p className="shrink-0 text-sm font-bold text-action">{formatPrice(p.revenue)}</p>
              </li>
            ))}
            {paginatedProducts.length === 0 && (
              <li className="p-8 text-center text-ink/50">Aucun produit trouvé.</li>
            )}
          </ul>

          {/* Desktop : tableau */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-canvas/50 text-xs uppercase tracking-wider text-ink/50">
                  <th className="px-6 py-4 font-semibold">Produit</th>
                  <th className="px-6 py-4 text-center font-semibold">Quantité vendue</th>
                  <th className="px-6 py-4 text-right font-semibold">CA généré</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedProducts.map((p: any, i: number) => (
                  <tr key={i} className="transition hover:bg-canvas/30">
                    <td className="px-6 py-4 font-medium text-ink">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="size-10 rounded-lg border border-line object-cover" />
                        ) : (
                          <div className="size-10 rounded-lg border border-line bg-canvas" />
                        )}
                        {p.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-ink/70">{p.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-action">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
                {paginatedProducts.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-ink/50">Aucun produit trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line bg-canvas/30 p-3 md:p-4">
              <span className="text-xs text-ink/50 md:text-sm">Page {currentPage} sur {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                  className="flex size-10 items-center justify-center rounded-lg border border-line bg-white transition hover:bg-canvas disabled:opacity-30 md:size-auto md:p-2"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                  className="flex size-10 items-center justify-center rounded-lg border border-line bg-white transition hover:bg-canvas disabled:opacity-30 md:size-auto md:p-2"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}