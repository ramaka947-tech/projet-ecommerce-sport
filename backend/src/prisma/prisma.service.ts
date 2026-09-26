import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5, delayMs = 3000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to database');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${retries} failed. Retrying in ${delayMs / 1000}s...`,
        );
        if (attempt === retries) {
          this.logger.error('Could not connect to database after retries');
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}