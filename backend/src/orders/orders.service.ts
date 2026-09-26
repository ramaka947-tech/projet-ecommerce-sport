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
    const { items, deliveryFee = 0, ...customerInfo } = createOrderDto;

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
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}`,
        );
      }
      const unitPrice = product.promoPrice ?? product.price;
      subtotal += unitPrice * item.quantity;
      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
      };
    });

    const total = subtotal + deliveryFee;

    const createOrderOp = this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        ...customerInfo,
        subtotal,
        deliveryFee,
        total,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: { include: { product: true } } },
    });

    const decrementStockOps = orderItemsData.map((item) =>
      this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      }),
    );

    const [order] = await this.prisma.$transaction([
      createOrderOp,
      ...decrementStockOps,
    ]);

    return order;
  }

  findAll() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: true } } },
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
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}