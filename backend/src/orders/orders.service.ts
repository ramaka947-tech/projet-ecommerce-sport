import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrderStatus } from '../generated/prisma/enums.js';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 900 + 100);
    return `CMD-${timestamp}${random}`;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items, deliveryFee = 0, customerId, ...customerInfo } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      if (product.stock === 0) {
        throw new BadRequestException(
          `"${product.name}" est en rupture de stock.`,
        );
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuffisant pour "${product.name}" : ${product.stock} disponible(s), ${item.quantity} demandé(s).`,
        );
      }
      const unitPrice = product.promoPrice ?? product.price;
      subtotal += unitPrice * item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        size: item.size ?? null,
        color: item.color ?? null,
        productName: product.name,
        productImage: product.images[0] ?? null,
      };
    });

    const pm = await this.prisma.paymentMethod.findFirst({
      where: { name: createOrderDto.paymentMethod, isActive: true },
    });
    if (!pm) {
      throw new BadRequestException('Moyen de paiement invalide ou désactivé.');
    }

    const total = subtotal + deliveryFee;

    const createOrderOp = this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        ...customerInfo,
        customerId: customerId || null,
        subtotal,
        deliveryFee,
        total,
        items: { create: orderItemsData },
        history: { create: { status: OrderStatus.NEW } },
      },
      include: { items: { include: { product: true } } },
    });

    const decrementStockOps = orderItemsData.map((item) =>
      this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      }),
    );

    // --- NOUVEAU : On prépare la mise à jour du panier en base (si client connecté) ---
    const operations: any[] = [createOrderOp, ...decrementStockOps];
    
    if (customerId) {
      operations.push(
        this.prisma.customer.update({
          where: { id: customerId },
          data: { cart: [] }, // On vide le panier sauvegardé
        })
      );
    }

    // On exécute toutes les opérations en une seule transaction
    const results = await this.prisma.$transaction(operations);
    const order = results[0]; // La première opération est toujours la création de la commande

    return order;
  }

  // Compare deux numéros en ignorant espaces, +, indicatif
  private samePhone(a: string, b: string): boolean {
    const x = (a || '').replace(/\D/g, '');
    const y = (b || '').replace(/\D/g, '');
    if (x.length < 8 || y.length < 8) return false;
    return x.endsWith(y) || y.endsWith(x);
  }

  private async findTracked(orderNumber: string, phone: string) {
    if (!orderNumber?.trim() || !phone?.trim()) {
      throw new BadRequestException('Numéro de commande et téléphone requis.');
    }
    const raw = orderNumber.trim().toUpperCase();
    const number = /^\d+$/.test(raw) ? `CMD-${raw}` : raw;

    const order = await this.prisma.order.findUnique({
      where: { orderNumber: number },
      include: {
        items: { include: { product: { select: { name: true, images: true } } } },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Même message dans les deux cas : on ne révèle pas si le numéro existe
    if (!order || !this.samePhone(order.customerPhone, phone)) {
      throw new NotFoundException('Commande introuvable. Vérifiez le numéro et le téléphone.');
    }
    return order;
  }

  track(orderNumber: string, phone: string) {
    return this.findTracked(orderNumber, phone);
  }

  async cancelTracked(orderNumber: string, phone: string) {
    const order = await this.findTracked(orderNumber, phone);

    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException(
        'Cette commande ne peut plus être annulée en ligne. Contactez-nous sur WhatsApp.',
      );
    }

    const restoreStockOps = order.items.map((item) =>
      this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      }),
    );

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          history: { create: { status: OrderStatus.CANCELLED } },
        },
      }),
      ...restoreStockOps,
    ]);

    return this.findTracked(orderNumber, phone);
  }

  findAll() {
    return this.prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        history: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    // Même statut : rien à faire (évite les doublons dans l'historique)
    if (order.status === dto.status) return order;

    const updateOp = this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        history: { create: { status: dto.status } },
      },
    });

    // Annulation : on remet le stock des produits
    if (dto.status === 'CANCELLED') {
      const restoreStockOps = order.items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        }),
      );
      const [updated] = await this.prisma.$transaction([updateOp, ...restoreStockOps]);
      return updated;
    }

    return updateOp;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}