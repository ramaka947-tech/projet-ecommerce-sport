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
    <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
      <div className="mb-2 flex items-center gap-2 md:mb-3 md:gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action/10 text-action">
          {icon}
        </div>
        <p className="truncate text-xs font-medium text-ink/60 md:text-sm">{label}</p>
      </div>
      <p className="truncate text-lg font-bold text-ink md:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-ink/40 md:mt-1 md:text-xs">{hint}</p>
    </div>
  );
}

function DashboardContent() {
  const { formatPrice } = useCurrency();

  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    setError(null);

    getStats(period)
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Erreur de chargement'); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });

    return () => { cancelled = true; };
  }, [period]);

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
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink md:text-2xl">Dashboard</h1>
          <p className="text-sm text-ink/60">Bonjour, voici un aperçu de votre boutique</p>
        </div>
        <div className="flex items-center gap-2">
          {statsLoading && <Loader2 size={16} className="animate-spin text-ink/40" />}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium focus:ring-action md:min-h-0 md:w-auto md:py-2"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-action/30 bg-action/5 px-3 py-2.5 text-sm text-action md:mb-6 md:flex-row md:items-center md:justify-between md:gap-4 md:px-4 md:py-3">
          <span className="min-w-0 break-words">Impossible de charger les statistiques : {error}</span>
          <button
            onClick={() => setPeriod((p) => p)}
            className="self-start font-semibold underline md:self-auto"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* KPI : 2 colonnes sur mobile */}
      <div className={`mb-4 grid grid-cols-2 gap-3 transition-opacity md:mb-6 md:gap-4 lg:grid-cols-4 ${statsLoading ? 'opacity-60' : ''}`}>
        <KpiCard icon={<TrendingUp size={16} />} label="Chiffre d'affaires" value={formatPrice(revenue)} hint={current.short} />
        <KpiCard icon={<ShoppingCart size={16} />} label="Commandes" value={orderCount} hint={current.short} />
        <KpiCard icon={<Wallet size={16} />} label="Panier moyen" value={formatPrice(averageBasket)} hint={current.short} />
        <KpiCard icon={<Package size={16} />} label="Produits" value={productCount ?? '—'} hint="dans le catalogue" />
      </div>

      {/* Graphique + commandes récentes */}
      <div className="mb-4 grid gap-4 md:mb-6 md:gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 md:mb-6">
            <h2 className="text-sm font-semibold text-ink md:text-base">Évolution du CA</h2>
            <span className="flex items-center gap-1 text-xs text-ink/60">
              <span className="size-2 rounded-full bg-action" /> {current.label.toLowerCase()}
            </span>
          </div>
          <div className="h-[220px] md:h-[280px]">
            {series.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink/50">
                {statsLoading ? 'Chargement...' : 'Aucune vente sur cette période'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={8} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    width={48}
                    tickFormatter={(v) => formatPrice(v).replace(' FCFA', '')}
                  />
                  <Tooltip formatter={(v: any) => formatPrice(v)} labelStyle={{ color: '#0A0A0A' }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#E11D2E"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#E11D2E' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-line bg-white p-3 shadow-sm md:p-5">
          <div className="mb-3 flex items-start justify-between gap-2 md:mb-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-ink md:text-base">Commandes récentes</h2>
              <p className="truncate text-xs text-ink/50">{rangeLabel}</p>
            </div>
            <Link href="/admin/commandes" className="shrink-0 text-xs font-semibold text-ink/60 hover:text-action">
              Voir tout →
            </Link>
          </div>

          <div className="flex-1 overflow-auto">
            {ordersLoading ? (
              <p className="py-8 text-center text-sm text-ink/50 md:py-10">Chargement...</p>
            ) : recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink/50 md:py-10">Aucune commande sur cette période</p>
            ) : (
              <ul className="divide-y divide-line">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {o.customerName || 'Client'}
                      </p>
                      <p className="truncate text-xs text-ink/50">
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

export default function DashboardPage() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  );
}