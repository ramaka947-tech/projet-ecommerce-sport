'use client';

import AdminGuard from '@/lib/admin-guard';

export default function DashboardPage() {
  return (
    <AdminGuard>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <p className="text-gray-500">Bienvenue dans l'espace administrateur.</p>
    </AdminGuard>
  );
}