import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../prisma/generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 Database disconnected');
  }

  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }
}
