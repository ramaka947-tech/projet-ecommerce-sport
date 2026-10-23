import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year': return new Date(now.getFullYear(), 0, 1);
      default: return new Date(0);
    }
  }

  async getStats(period: string = '30d') {
    const startDate = this.getStartDate(period);

    // 1. TOUTES les commandes (sauf annulées) pour le volume
    const allOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: 'asc' },
    });

    // 2. UNIQUEMENT les commandes livrées pour le CA et les produits
    const deliveredOrders = allOrders.filter(o => o.status === 'DELIVERED');

    // --- CALCULS ---
    
    // Nombre total de commandes (hors annulées)
    const orderCount = allOrders.length;

    // CA (uniquement sur les livrées)
    const revenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrder = deliveredOrders.length > 0 ? revenue / deliveredOrders.length : 0;

    // Évolution du CA (uniquement sur les livrées)
    const revenueByDay: Record<string, number> = {};
    deliveredOrders.forEach((o) => {
      const day = o.createdAt.toISOString().slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + o.total;
    });
    const revenueSeries = Object.entries(revenueByDay)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Ventes par catégorie (uniquement sur les livrées)
    const salesByCategory: Record<string, number> = {};
    deliveredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product.category?.name || 'Sans catégorie';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + item.unitPrice * item.quantity;
      });
    });
    const categorySeries = Object.entries(salesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top produits (uniquement sur les livrées)
        const productSales: Record<string, { name: string; image: string | null; quantity: number; revenue: number }> = {};
    deliveredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = { 
            name: item.product.name, 
            image: item.product.images?.[0] || null, // <-- On ajoute l'image
            quantity: 0, 
            revenue: 0 
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.unitPrice * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue);

        return {
      revenue,
      orderCount, // Total des commandes non annulées
      deliveredCount: deliveredOrders.length, // <-- AJOUTE CETTE LIGNE
      avgOrder,
      revenueSeries,
      categorySeries,
      topProducts,
    };
  }
}