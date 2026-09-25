import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SettingsModule } from './settings/settings.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [SettingsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}