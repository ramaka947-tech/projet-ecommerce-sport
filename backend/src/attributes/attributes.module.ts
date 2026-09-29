import { Module } from '@nestjs/common';
import { AttributesController } from './attributes.controller.js';
import { AttributesService } from './attributes.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AttributesController],
  providers: [AttributesService],
})
export class AttributesModule {}