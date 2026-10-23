'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, TrendingUp, ShoppingCart, Package, Wallet } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import AdminGuard from '@/lib/admin-guard';
import { useCurrency } from '@/lib/currency';
import { getStats, getOrders, getAdminProducts } from '@/lib/api';

type Period = 'today' | '7d' | '30d';

const PERIODS: { value: Period; label: string; short: string }[] = [
  { value: 'today', label: "Aujourd'hui", short: "aujourd'hui" },
  { value: '7d', label: '7 derniers jours', short: 'sur 7 jours' },
  { value: '30d', label: '30 derniers jours', short: 'sur 30 jours' },
];

// Statuts de commande : valeur API (en anglais) -> libellé français + couleur
const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmée', className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'En préparation', className: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'Expédiée', className: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Livrée', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminée', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
  canceled: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
  refunded: { label: 'Remboursée', className: 'bg-gray-100 text-gray-700' },
};

function StatusBadge({ status }: { status: string }) {
  const key = String(status).trim().toLowerCase();
  const info = ORDER_STATUS[key] ?? { label: String(status), className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${info.className}`}>
      {info.label}
    </span>
  );
}

function KpiCard({
  icon, label, value, hint,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className="bg-white rounded-xl border border-line p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-action/10 text-action flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm font-medium text-ink/60">{label}</p>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/40 mt-1">{hint}</p>
    </div>
  );
}

function DashboardContent() {
  const { formatPrice } = useCurrency();

  // Par défaut : Aujourd'hui
  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productCount, setProductCount] = useState<number | null>(null);

  // Stats : se recharge à chaque changement de période
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setError(null);

    getStats(period)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Erreur de chargement'); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });

    return () => { cancelled = true; }; // ignore une réponse arrivée trop tard
  }, [period]);

  // Commandes récentes + nombre de produits : une seule fois
  useEffect(() => {
    let cancelled = false;

    getOrders()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.items ?? [];
        list.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setOrders(list);
      })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setOrdersLoading(false); });

    getAdminProducts()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.items ?? [];
        setProductCount(list.length);
      })
      .catch(() => { if (!cancelled) setProductCount(null); });

    return () => { cancelled = true; };
  }, []);

  const current = PERIODS.find((p) => p.value === period)!;

  // Début de la période : minuit du premier jour (aujourd'hui = 1 jour, 7d = 7 jours, 30d = 30 jours)
  const rangeStart = useMemo(() => {
    const days = period === 'today' ? 1 : period === '7d' ? 7 : 30;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d;
  }, [period]);

  const recentOrders = useMemo(
    () =>
      orders
        .filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= rangeStart.getTime())
        .slice(0, 5),
    [orders, rangeStart],
  );

  const fmtDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const rangeLabel =
    period === 'today' ? `Aujourd'hui, ${fmtDay(new Date())}` : `Du ${fmtDay(rangeStart)} au ${fmtDay(new Date())}`;
  const revenue = Number(stats?.revenue ?? 0);
  const orderCount = Number(stats?.orderCount ?? 0);
  const averageBasket = orderCount > 0 ? revenue / orderCount : 0;
  const series = stats?.revenueSeries ?? [];

  return (
    <>
      {/* Titre + filtre période */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink/60">Bonjour, voici un aperçu de votre boutique</p>
        </div>
        <div className="flex items-center gap-2">
          {statsLoading && <Loader2 size={16} className="animate-spin text-ink/40" />}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="w-auto border-line rounded-lg text-sm font-medium py-2 px-3 focus:ring-action"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-action/30 bg-action/5 px-4 py-3 text-sm text-action">
          <span>Impossible de charger les statistiques : {error}</span>
          <button
            onClick={() => setPeriod((p) => p)}
            className="font-semibold underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Cartes KPI : uniquement des données réelles */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-opacity ${statsLoading ? 'opacity-60' : ''}`}>
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Chiffre d'affaires"
          value={formatPrice(revenue)}
          hint={current.short}
        />
        <KpiCard
          icon={<ShoppingCart size={16} />}
          label="Commandes"
          value={orderCount}
          hint={current.short}
        />
        <KpiCard
          icon={<Wallet size={16} />}
          label="Panier moyen"
          value={formatPrice(averageBasket)}
          hint={current.short}
        />
        <KpiCard
          icon={<Package size={16} />}
          label="Produits"
          value={productCount ?? '—'}
          hint="dans le catalogue"
        />
      </div>

      {/* Graphique + commandes récentes */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mb-6">
        <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-ink">Évolution du chiffre d'affaires</h2>
            <span className="flex items-center gap-1 text-xs text-ink/60">
              <span className="w-2 h-2 rounded-full bg-action" /> CA · {current.label.toLowerCase()}
            </span>
          </div>
          <div className="h-[280px]">
            {series.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink/50">
                {statsLoading ? 'Chargement...' : 'Aucune vente sur cette période'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(v) => formatPrice(v).replace(' FCFA', '')}
                  />
                  <Tooltip formatter={(v: any) => formatPrice(v)} labelStyle={{ color: '#0A0A0A' }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#E11D2E"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#E11D2E' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-line rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-ink">Commandes récentes</h2>
              <p className="text-xs text-ink/50">{rangeLabel}</p>
            </div>
            <Link href="/admin/commandes" className="text-xs font-semibold text-ink/60 hover:text-action">
              Voir tout →
            </Link>
          </div>

          <div className="flex-1 overflow-auto">
            {ordersLoading ? (
              <p className="text-sm text-ink/50 text-center py-10">Chargement des commandes...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-ink/50 text-center py-10">Aucune commande sur cette période</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {o.customerName || 'Client'}
                      </p>
                      <p className="text-xs text-ink/50">
                        {o.orderNumber ? `#${o.orderNumber} · ` : ''}
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString('fr-FR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-ink">
                        {formatPrice(Number(o.total ?? o.totalAmount ?? 0))}
                      </p>
                      {o.status && (
                        <div className="mt-1">
                          <StatusBadge status={o.status} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Le guard entoure tout : les données ne sont chargées qu'une fois la session vérifiée
export default function DashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}