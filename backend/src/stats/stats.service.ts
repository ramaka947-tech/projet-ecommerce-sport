import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(0);
    }
  }

  async getStats(period: string = '30d') {
    const startDate = this.getStartDate(period);

    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: 'asc' },
    });

    // CA total sur la période
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);

    // Nombre de commandes
    const orderCount = orders.length;

    // Panier moyen
    const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

    // Évolution du CA groupée par jour
    const revenueByDay: Record<string, number> = {};
    orders.forEach((o) => {
      const day = o.createdAt.toISOString().slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + o.total;
    });
    const revenueSeries = Object.entries(revenueByDay)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Ventes par catégorie
    const salesByCategory: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const cat = item.product.category?.name || 'Sans catégorie';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + item.unitPrice * item.quantity;
      });
    });
    const categorySeries = Object.entries(salesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top produits
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = { name: item.product.name, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += item.unitPrice * item.quantity;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      revenue,
      orderCount,
      avgOrder,
      revenueSeries,
      categorySeries,
      topProducts,
    };
  }
}