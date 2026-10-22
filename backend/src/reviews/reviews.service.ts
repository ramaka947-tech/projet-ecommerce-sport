import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    // Récupère les avis approuvés d'un produit + la moyenne
    async findByProduct(productId: string) {
        const reviews = await this.prisma.review.findMany({
            where: { productId, isApproved: true },
            orderBy: { createdAt: 'desc' },
        });

        const total = reviews.length;
        const average = total > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;

        return {
            average: Math.round(average * 10) / 10, // arrondi à 1 décimale
            total,
            // on retire le téléphone avant d'envoyer au public
            reviews: reviews.map(({ customerPhone, ...publicReview }) => publicReview),
        };
    }

    // Créer un avis (vérifie que le client a une commande livrée de ce produit)
    async create(data: {
        productId: string;
        rating: number;
        comment?: string;
        customerPhone: string;
    }) {
        if (data.rating < 1 || data.rating > 5) {
            throw new BadRequestException('La note doit être entre 1 et 5.');
        }

        // Vérifier qu'une commande livrée contient bien ce produit
        const order = await this.prisma.order.findFirst({
            where: {
                customerPhone: data.customerPhone,
                status: 'DELIVERED',
                items: { some: { productId: data.productId } },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!order) {
            throw new BadRequestException(
                'Vous devez avoir reçu ce produit pour laisser un avis.',
            );
        }

        // Vérifier qu'un avis n'existe pas déjà pour ce même téléphone + produit
        const existing = await this.prisma.review.findFirst({
            where: {
                productId: data.productId,
                customerPhone: data.customerPhone,
            },
        });
        if (existing) {
            throw new BadRequestException(
                'Vous avez déjà laissé un avis sur ce produit.',
            );
        }

        // Nom affiché : prénom + initiale du nom
        const parts = order.customerName.trim().split(' ');
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
        const authorName = lastName
            ? `${firstName} ${lastName.charAt(0).toUpperCase()}.`
            : firstName;

        return this.prisma.review.create({
            data: {
                productId: data.productId,
                rating: data.rating,
                comment: data.comment,
                customerPhone: data.customerPhone,
                authorName,
                isApproved: false, // modération manuelle
            },
        });
    }

    // Admin : tous les avis (avec le produit)
    findAll() {
        return this.prisma.review.findMany({
            include: { product: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async approve(id: string) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) throw new NotFoundException('Avis introuvable');
        return this.prisma.review.update({
            where: { id },
            data: { isApproved: true },
        });
    }

    async remove(id: string) {
        const review = await this.prisma.review.findUnique({ where: { id } });
        if (!review) throw new NotFoundException('Avis introuvable');
        return this.prisma.review.delete({ where: { id } });
    }
}