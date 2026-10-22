import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const WITH_ENTRIES = {
  entries: { orderBy: { createdAt: 'asc' as const } },
};

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  create(data: {
    name: string;
    email: string;
    subject?: string;
    content: string;
    customerId?: string;
  }) {
    return this.prisma.message.create({ data });
  }

  findAll() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      include: WITH_ENTRIES,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.message.update({ where: { id }, data: { isRead: true } });
  }

  async remove(id: string) {
    return this.prisma.message.delete({ where: { id } });
  }

  // Réponse de l'admin : ajoute une entrée ADMIN au fil (peut être appelée plusieurs fois)
  async reply(id: string, replyText: string) {
    const text = String(replyText || '').trim();
    if (!text) throw new BadRequestException('La réponse est vide.');

    const msg = await this.prisma.message.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Message introuvable');

    const [, updated] = await this.prisma.$transaction([
      this.prisma.messageEntry.create({
        data: { messageId: id, author: 'ADMIN', content: text },
      }),
      this.prisma.message.update({
        where: { id },
        data: { isRead: true },
        include: WITH_ENTRIES,
      }),
    ]);
    return updated;
  }

  // Suite de la discussion côté client
  async addCustomerEntry(customerId: string, messageId: string, content: string) {
    const text = String(content || '').trim();
    if (!text) throw new BadRequestException('Le message est vide.');
    if (text.length > 2000) throw new BadRequestException('Message trop long (2000 caractères max).');

    // Le message doit appartenir au client connecté
    const msg = await this.prisma.message.findFirst({
      where: { id: messageId, customerId },
    });
    if (!msg) throw new NotFoundException('Message introuvable');

    const [, updated] = await this.prisma.$transaction([
      this.prisma.messageEntry.create({
        data: { messageId, author: 'CUSTOMER', content: text },
      }),
      // isRead repasse à false : la conversation réapparaît comme non lue pour l'admin
      this.prisma.message.update({
        where: { id: messageId },
        data: { isRead: false },
        include: WITH_ENTRIES,
      }),
    ]);
    return updated;
  }
}