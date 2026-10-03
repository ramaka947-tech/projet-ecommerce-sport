import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { HeroMediaService } from './hero-media.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('hero-media')
export class HeroMediaController {
  constructor(private readonly heroMediaService: HeroMediaService) {}

  @Get()
  findAll() {
    return this.heroMediaService.findAllActive();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAllAdmin() {
    return this.heroMediaService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: { type: string; url: string }) {
    return this.heroMediaService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.heroMediaService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.heroMediaService.remove(id);
  }
}