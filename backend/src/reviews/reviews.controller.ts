import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Post()
  create(@Body() body: {
    productId: string;
    rating: number;
    comment?: string;
    customerPhone: string;
  }) {
    return this.reviewsService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.reviewsService.findAll();
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string) {
    return this.reviewsService.approve(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}