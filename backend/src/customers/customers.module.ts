import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { CustomerJwtStrategy } from './customer-auth.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerJwtStrategy],
})
export class CustomersModule {}