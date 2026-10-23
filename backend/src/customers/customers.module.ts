import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { CustomerJwtStrategy } from './customer-auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [PrismaModule, MailModule, JwtModule.register({})],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerJwtStrategy],
})
export class CustomersModule {}