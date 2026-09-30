import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SettingsModule } from './settings/settings.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StatsModule } from './stats/stats.module.js';
import { UploadModule } from './upload/upload.module.js';
import { AttributesModule } from './attributes/attributes.module.js';
import { CustomersModule } from './customers/customers.module.js';

@Module({
  imports: [SettingsModule, PrismaModule, CategoriesModule, ProductsModule, OrdersModule, AuthModule, StatsModule, UploadModule, AttributesModule, CustomersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}