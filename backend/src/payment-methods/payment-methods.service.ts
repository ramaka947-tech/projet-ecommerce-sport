import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  findActive() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findAll() {
    return this.prisma.paymentMethod.findMany({
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  create(data: {
    name: string;
    instructions?: string;
    isActive?: boolean;
    position?: number;
  }) {
    return this.prisma.paymentMethod.create({
      data: {
        name: data.name,
        instructions: data.instructions,
        isActive: data.isActive,
        position: data.position,
      },
    });
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException();
    return this.prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        instructions: data.instructions,
        isActive: data.isActive,
        position: data.position,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.paymentMethod.delete({ where: { id } });
    return { success: true };
  }
}