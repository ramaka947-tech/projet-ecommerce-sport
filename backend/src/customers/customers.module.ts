import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { CustomerJwtStrategy } from './customer-auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MailService } from '../mail/mail.service.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerJwtStrategy, MailService],
})
export class CustomersModule {}