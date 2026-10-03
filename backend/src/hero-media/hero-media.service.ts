import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class HeroMediaService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.heroMedia.findMany({ orderBy: { position: 'asc' } });
  }

  findAllActive() {
    return this.prisma.heroMedia.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
  }

  create(data: { type: string; url: string }) {
    return this.prisma.heroMedia.create({
      data: { ...data, position: Date.now() },
    });
  }

  async update(id: string, data: Partial<{ type: string; url: string; isActive: boolean; position: number }>) {
    const media = await this.prisma.heroMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException(`HeroMedia ${id} not found`);
    return this.prisma.heroMedia.update({ where: { id }, data });
  }

  async remove(id: string) {
    const media = await this.prisma.heroMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException(`HeroMedia ${id} not found`);
    return this.prisma.heroMedia.delete({ where: { id } });
  }
}