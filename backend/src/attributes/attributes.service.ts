import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AttributesService {
  constructor(private prisma: PrismaService) {}

  // Sizes
  findAllSizes() {
    return this.prisma.size.findMany({ orderBy: { name: 'asc' } });
  }

  createSize(name: string) {
    return this.prisma.size.create({ data: { name } });
  }

  async removeSize(id: string) {
    const size = await this.prisma.size.findUnique({ where: { id } });
    if (!size) throw new NotFoundException(`Size ${id} not found`);
    return this.prisma.size.delete({ where: { id } });
  }

  // Colors
  findAllColors() {
    return this.prisma.color.findMany({ orderBy: { name: 'asc' } });
  }

  createColor(name: string) {
    return this.prisma.color.create({ data: { name } });
  }

  async removeColor(id: string) {
    const color = await this.prisma.color.findUnique({ where: { id } });
    if (!color) throw new NotFoundException(`Color ${id} not found`);
    return this.prisma.color.delete({ where: { id } });
  }
}