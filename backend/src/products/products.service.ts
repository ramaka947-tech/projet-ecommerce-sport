import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({ data: createProductDto });
  }

  private computeRating(product: any) {
    const reviews = product.reviews || [];
    const count = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count
      : 0;
    return {
      ...product,
      ratingAverage: Math.round(average * 10) / 10,
      ratingCount: count,
    };
  }

  async findAll(filters: {
    categoryId?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    onSale?: string;
    page?: string;
    limit?: string;
    paginated?: string;
    includeOutOfStock?: string;
    sizes?: string;
    colors?: string;
    brand?: string;
  } = {}) {
    const {
      categoryId, search, sort, minPrice, maxPrice, onSale,
      page, limit, paginated, includeOutOfStock,
      sizes, colors, brand,
    } = filters;

    const where: any = {};

    if (includeOutOfStock !== 'true') {
      where.stock = { gt: 0 };
    }

    if (categoryId) where.categoryId = categoryId;

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    if (onSale === 'true') where.promoPrice = { not: null };

    if (sizes) {
      where.sizes = { hasSome: sizes.split(',').map((s) => s.trim()) };
    }

    if (colors) {
      where.colors = { hasSome: colors.split(',').map((c) => c.trim()) };
    }

    if (brand) {
      where.brands = { hasSome: brand.split(',').map((b) => b.trim()) };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };

    const include = {
      category: true,
      reviews: {
        where: { isApproved: true },
        select: { rating: true },
      },
    };

    if (paginated === 'true') {
      const pageNum = Math.max(1, Number(page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

      const [items, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          orderBy,
          include,
          skip: (pageNum - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.product.count({ where }),
      ]);

      return {
        items: items.map((p) => this.computeRating(p)),
        total,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const items = await this.prisma.product.findMany({
      where,
      orderBy,
      include,
    });

    return items.map((p) => this.computeRating(p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}