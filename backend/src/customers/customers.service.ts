import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    country?: string;
    region?: string;
    district?: string;
  }) {
    const existing = await this.prisma.customer.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hash = await bcrypt.hash(data.password, 10);
    const customer = await this.prisma.customer.create({
      data: { ...data, password: hash },
    });

    const token = this.jwt.sign(
      { sub: customer.id, email: customer.email, type: 'customer' },
      { secret: process.env.JWT_SECRET_CUSTOMER, expiresIn: '7d' },
    );

    return {
      accessToken: token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        country: customer.country,
        region: customer.region,
        district: customer.district,
      },
    };
  }

  async login(email: string, password: string) {
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (!customer) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    const token = this.jwt.sign(
      { sub: customer.id, email: customer.email, type: 'customer' },
      { secret: process.env.JWT_SECRET_CUSTOMER, expiresIn: '7d' },
    );

    return {
      accessToken: token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        country: customer.country,
        region: customer.region,
        district: customer.district,
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phone: true,
        country: true, region: true, district: true,
      },
    });
    if (!customer) throw new UnauthorizedException();
    return customer;
  }
  async getOrders(customerId: string) {
  return this.prisma.order.findMany({
    where: { customerId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
  
}
}

