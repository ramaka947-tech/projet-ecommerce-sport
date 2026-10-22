import { Module } from '@nestjs/common';
import { PaymentMethodsController } from './payment-methods.controller.js';
import { PaymentMethodsService } from './payment-methods.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentMethodsController],
  providers: [PaymentMethodsService],
})
export class PaymentMethodsModule {}