'use client';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';
import { Loader2, TrendingUp, ShoppingCart, Package, Box } from 'lucide-react';
import AdminGuard from '@/lib/admin-guard';
import { useCurrency } from '@/lib/currency';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function DashboardPage() {
  const { formatPrice } = useCurrency();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats('30d')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center h-64 text-ink/50">
          <Loader2 className="animate-spin mr-2" /> Chargement...
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      {/* Titre + Filtre période */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink/60">Bonjour, voici un aperçu de votre boutique</p>
        </div>
        <select className="w-auto border-line rounded-lg text-sm font-medium py-2 px-3 focus:ring-action">
          <option>30 derniers jours</option>
          <option>7 derniers jours</option>
          <option>Aujourd'hui</option>
        </select>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-line p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-action/10 text-action flex items-center justify-center"><TrendingUp size={16} /></div>
            <p className="text-sm font-medium text-ink/60">Chiffre d'affaires</p>
          </div>
          <p className="text-2xl font-bold text-ink">{formatPrice(stats?.revenue || 0)}</p>
          <p className="text-xs text-success mt-1">↗ +12,8% <span className="text-ink/40">par rapport aux 30 derniers jours</span></p>
        </div>

        <div className="bg-white rounded-xl border border-line p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-action/10 text-action flex items-center justify-center"><ShoppingCart size={16} /></div>
            <p className="text-sm font-medium text-ink/60">Ventes aujourd'hui</p>
          </div>
          <p className="text-2xl font-bold text-ink">{formatPrice(0)}</p>
          <p className="text-xs text-success mt-1">↗ +8,4% <span className="text-ink/40">par rapport à hier</span></p>
        </div>

        <div className="bg-white rounded-xl border border-line p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-action/10 text-action flex items-center justify-center"><Package size={16} /></div>
            <p className="text-sm font-medium text-ink/60">Commandes</p>
          </div>
          <p className="text-2xl font-bold text-ink">{stats?.orderCount || 0}</p>
          <p className="text-xs text-success mt-1">↗ +3 <span className="text-ink/40">cette semaine</span></p>
        </div>

        <div className="bg-white rounded-xl border border-line p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-action/10 text-action flex items-center justify-center"><Box size={16} /></div>
            <p className="text-sm font-medium text-ink/60">Produits actifs</p>
          </div>
          <p className="text-2xl font-bold text-ink">124</p>
          <p className="text-xs text-success mt-1">↗ +5 <span className="text-ink/40">par rapport au mois dernier</span></p>
        </div>
      </div>

      {/* Graphique + Commandes récentes */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mb-6">
        
        {/* Graphique CA */}
        <div className="bg-white border border-line rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-ink">Évolution du chiffre d'affaires</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-action"></span> CA</span>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.revenueSeries || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => formatPrice(v).replace(' FCFA', '')} />
                <Tooltip formatter={(v: any) => formatPrice(v)} labelStyle={{ color: '#0A0A0A' }} />
                <Line type="monotone" dataKey="value" stroke="#E11D2E" strokeWidth={3} dot={{ r: 4, fill: '#E11D2E' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commandes récentes */}
        <div className="bg-white border border-line rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">Commandes récentes</h2>
            <button className="text-xs font-semibold text-ink/60 hover:text-action">Voir tout →</button>
          </div>
          <div className="flex-1 overflow-auto">
             {/* Remplace par ta vraie liste de commandes */}
             <p className="text-sm text-ink/50 text-center py-10">Chargement des commandes...</p>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}