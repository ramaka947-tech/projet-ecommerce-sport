import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrderStatus } from '../generated/prisma/enums.js';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
  ) { }

  private normalizeEmail(email: string) {
    return String(email || '').trim().toLowerCase();
  }

  private signToken(c: any) {
    return this.jwt.sign(
      { sub: c.id, email: c.email, type: 'customer' },
      { secret: process.env.JWT_SECRET_CUSTOMER, expiresIn: '7d' },
    );
  }

  private publicCustomer(c: any) {
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      country: c.country,
      region: c.region,
      district: c.district,
      address: c.address,
    };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    country?: string;
    region?: string;
    district?: string;
    address?: string;
  }) {
    const email = this.normalizeEmail(data.email);
    const name = String(data.name || '').trim();
    const phone = String(data.phone || '').trim();
    const password = String(data.password || '');

    if (name.length < 2) throw new BadRequestException('Nom invalide.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('Email invalide.');
    if (password.length < 6)
      throw new BadRequestException('Le mot de passe doit contenir au moins 6 caractères.');
    if (phone.replace(/\D/g, '').length < 6) throw new BadRequestException('Téléphone invalide.');

    const existing = await this.prisma.customer.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hash = await bcrypt.hash(password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        name,
        email,
        phone,
        password: hash,
        country: data.country?.trim() || null,
        region: data.region?.trim() || null,
        district: data.district?.trim() || null,
        address: data.address?.trim() || null,
      },
    });

    // Pas de "await" : l'inscription n'attend pas l'email
    void this.mail.sendWelcome(customer.email, customer.name);

    return { accessToken: this.signToken(customer), customer: this.publicCustomer(customer) };
  }

  async login(email: string, password: string) {
    const normalized = this.normalizeEmail(email);
    // Le 2e essai couvre les anciens comptes enregistrés avec des majuscules
    const customer =
      (await this.prisma.customer.findUnique({ where: { email: normalized } })) ??
      (await this.prisma.customer.findUnique({ where: { email: String(email || '').trim() } }));
    if (!customer) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    return { accessToken: this.signToken(customer), customer: this.publicCustomer(customer) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        region: true,
        district: true,
        address: true, // AJOUT : l'adresse n'était pas renvoyée par /me
      },
    });
    if (!customer) throw new UnauthorizedException();
    return customer;
  }

  // AJOUT : modifier mes informations (nom, téléphone, région, adresse)
  // L'email et le mot de passe ne sont volontairement PAS modifiables ici.
  async updateProfile(
    customerId: string,
    data: { name?: string; phone?: string; region?: string; address?: string },
  ) {
    const update: Record<string, any> = {};

    if (data.name !== undefined) {
      const name = String(data.name || '').trim();
      if (name.length < 2) throw new BadRequestException('Nom invalide.');
      update.name = name;
    }

    if (data.phone !== undefined) {
      const phone = String(data.phone || '').trim();
      if (phone.replace(/\D/g, '').length < 6) throw new BadRequestException('Téléphone invalide.');
      update.phone = phone;
    }

    if (data.region !== undefined) {
      update.region = String(data.region || '').trim() || null;
    }

    if (data.address !== undefined) {
      update.address = String(data.address || '').trim() || null;
    }

    const customer = await this.prisma.customer.update({
      where: { id: customerId },
      data: update,
    });

    return this.publicCustomer(customer);
  }

  // Liste de mes commandes
  async getOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Détail d'UNE de mes commandes (jamais celle d'un autre client)
  async getOrder(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: {
        items: { include: { product: true } },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    return order;
  }

  // Annuler ma commande : seulement si elle est encore "Nouvelle"
  async cancelOrder(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException(
        "Cette commande ne peut plus être annulée en ligne. Contactez-nous sur WhatsApp.",
      );
    }

    const restoreStockOps = order.items.map((item) =>
      this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      }),
    );

    const [updated] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          history: { create: { status: OrderStatus.CANCELLED } },
        },
      }),
      ...restoreStockOps,
    ]);

    return updated;
  }

  // Panier + favoris sauvegardés du client connecté
  async getSaved(customerId: string) {
    const c = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { cart: true, favorites: true },
    });
    return {
      cart: Array.isArray(c?.cart) ? c.cart : [],
      favorites: Array.isArray(c?.favorites) ? c.favorites : [],
    };
  }

  async saveSaved(customerId: string, data: { cart?: any[]; favorites?: any[] }) {
    const update: Record<string, any> = {};
    if (Array.isArray(data.cart)) update.cart = data.cart.slice(0, 100);
    if (Array.isArray(data.favorites)) update.favorites = data.favorites.slice(0, 200);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: update,
    });
    return { ok: true };
  }

  // Mes messages, avec les échanges de chaque conversation
  async getMessages(customerId: string) {
    return this.prisma.message.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: { entries: { orderBy: { createdAt: 'asc' } } },
    });
  }

  // Continuer une discussion : le message doit appartenir au client connecté
  async addMessageEntry(customerId: string, messageId: string, content: string) {
    const text = String(content || '').trim();
    if (!text) throw new BadRequestException('Le message est vide.');
    if (text.length > 2000)
      throw new BadRequestException('Message trop long (2000 caractères max).');

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
        include: { entries: { orderBy: { createdAt: 'asc' } } },
      }),
    ]);
    return updated;
  }
}