import {
  Controller, Get, Post, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { AttributesService } from './attributes.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller()
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  // Sizes
  @Get('sizes')
  findAllSizes() {
    return this.attributesService.findAllSizes();
  }

  @Post('sizes')
  @UseGuards(JwtAuthGuard)
  createSize(@Body() body: { name: string }) {
    return this.attributesService.createSize(body.name);
  }

  @Delete('sizes/:id')
  @UseGuards(JwtAuthGuard)
  removeSize(@Param('id') id: string) {
    return this.attributesService.removeSize(id);
  }

  // Colors
  @Get('colors')
  findAllColors() {
    return this.attributesService.findAllColors();
  }

  @Post('colors')
  @UseGuards(JwtAuthGuard)
  createColor(@Body() body: { name: string }) {
    return this.attributesService.createColor(body.name);
  }

  @Delete('colors/:id')
  @UseGuards(JwtAuthGuard)
  removeColor(@Param('id') id: string) {
    return this.attributesService.removeColor(id);
  }
}