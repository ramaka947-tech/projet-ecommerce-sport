'use client';
import { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, CartesianGrid,
} from 'recharts';
import AdminGuard from '@/lib/admin-guard';
import { getStats } from '@/lib/api';

const PERIODS = [
    { value: 'today', label: "Aujourd'hui" },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' },
    { value: 'all', label: 'Toutes périodes' },
];

export default function StatsPage() {
    const [period, setPeriod] = useState('30d');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getStats(period)
            .then(setStats)
            .finally(() => setLoading(false));
    }, [period]);

    return (
        <AdminGuard>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Statistiques</h1>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border rounded px-3 py-2 bg-transparent"
                >
                    {PERIODS.map((p) => (
                        <option key={p.value} value={p.value} className="text-black">
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>

            {loading || !stats ? (
                <p className="text-gray-500">Chargement...</p>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                            <p className="text-2xl font-bold">{stats.revenue.toFixed(2)} €</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Commandes</p>
                            <p className="text-2xl font-bold">{stats.orderCount}</p>
                        </div>
                        <div className="border rounded-lg p-4">
                            <p className="text-sm text-gray-500">Panier moyen</p>
                            <p className="text-2xl font-bold">{stats.avgOrder.toFixed(2)} €</p>
                        </div>
                    </div>

                    <div className="border rounded-lg p-6 mb-8">
                        <h2 className="font-semibold mb-4">Évolution du chiffre d'affaires</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.revenueSeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="border rounded-lg p-6 mb-8">
                        <h2 className="font-semibold mb-4">Ventes par catégorie</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.categorySeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="border rounded-lg p-6">
                        <h2 className="font-semibold mb-4">Top 5 produits</h2>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b text-left text-sm text-gray-500">
                                    <th className="pb-2">Produit</th>
                                    <th className="pb-2">Quantité vendue</th>
                                    <th className="pb-2">CA généré</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topProducts.map((p: any, i: number) => (
                                    <tr key={i} className="border-b">
                                        <td className="py-3">{p.name}</td>
                                        <td className="py-3">{p.quantity}</td>
                                        <td className="py-3">{p.revenue.toFixed(2)} €</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </AdminGuard>
    );
}