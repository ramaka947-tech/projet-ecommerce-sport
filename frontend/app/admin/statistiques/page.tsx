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
  
  // États pour le filtre du tableau
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getStats(period)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    setPage(1); // Reset la page quand on cherche
  }, [search, period]);

  if (loading || !stats) {
    return <AdminGuard><div className="flex justify-center p-12"><Loader2 className="animate-spin text-action" size={32} /></div></AdminGuard>;
  }

  // Filtrage des produits
  const filteredProducts = stats.topProducts.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <AdminGuard>
      
      {/* En-tête avec sélecteur de période (boutons) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">Statistiques</h1>
          <p className="text-sm text-ink/60 mt-1">Suivez les performances de votre boutique en temps réel.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white border border-line rounded-xl p-1.5 shadow-sm">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                period === p.value 
                  ? 'bg-action text-white shadow-sm' 
                  : 'text-ink/60 hover:bg-canvas hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        
                {/* Cartes KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-action/10 text-action flex items-center justify-center"><TrendingUp size={20} /></div>
              <p className="text-sm font-semibold text-ink/60">Chiffre d'affaires</p>
            </div>
            <p className="text-2xl font-bold text-ink">{formatPrice(stats.revenue)}</p>
          </div>
          
          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><ShoppingCart size={20} /></div>
              <p className="text-sm font-semibold text-ink/60">Total commandes</p>
            </div>
            <p className="text-2xl font-bold text-ink">{stats.orderCount}</p>
          </div>

          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center"><CheckCircle2 size={20} /></div>
              <p className="text-sm font-semibold text-ink/60">Commandes livrées</p>
            </div>
            <p className="text-2xl font-bold text-ink">{stats.deliveredCount}</p>
          </div>
          
          <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><ShoppingBag size={20} /></div>
              <p className="text-sm font-semibold text-ink/60">Panier moyen</p>
            </div>
            <p className="text-2xl font-bold text-ink">{formatPrice(stats.avgOrder)}</p>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid xl:grid-cols-[1.5fr_1fr] gap-6">
          
          <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-ink mb-6">Évolution du chiffre d'affaires</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                  <Tooltip formatter={(v: any) => formatPrice(v)} labelStyle={{ color: '#0A0A0A' }} />
                  <Line type="monotone" dataKey="value" stroke="#E11D2E" strokeWidth={3} dot={{ r: 4, fill: '#E11D2E' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-line rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-ink mb-6">Ventes par catégorie</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categorySeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                  <Tooltip formatter={(v: any) => formatPrice(v)} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#E11D2E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Top Produits avec recherche et pagination */}
        <div className="bg-white border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center"><Package size={16} /></div>
              <h2 className="font-bold text-ink">Top des produits vendus</h2>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:border-action bg-canvas/30"
              />
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas/50 text-ink/50 text-xs uppercase tracking-wider border-b border-line">
                <th className="px-6 py-4 font-semibold">Produit</th>
                <th className="px-6 py-4 font-semibold text-center">Quantité vendue</th>
                <th className="px-6 py-4 font-semibold text-right">CA généré</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
                            {paginatedProducts.map((p: any, i: number) => (
                <tr key={i} className="hover:bg-canvas/30 transition">
                  <td className="px-6 py-4 font-medium text-ink">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-line" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-canvas border border-line" />
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
          
          {/* Pagination (affiché si plus de 5 produits) */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-line flex justify-between items-center bg-canvas/30">
              <span className="text-sm text-ink/50">Page {currentPage} sur {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="p-2 border border-line bg-white rounded-lg hover:bg-canvas disabled:opacity-30 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className="p-2 border border-line bg-white rounded-lg hover:bg-canvas disabled:opacity-30 transition"
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