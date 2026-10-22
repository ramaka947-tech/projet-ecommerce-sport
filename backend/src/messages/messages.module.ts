import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}