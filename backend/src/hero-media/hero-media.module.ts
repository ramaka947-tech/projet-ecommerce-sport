import { Module } from '@nestjs/common';
import { HeroMediaController } from './hero-media.controller.js';
import { HeroMediaService } from './hero-media.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [HeroMediaController],
  providers: [HeroMediaService],
})
export class HeroMediaModule {}