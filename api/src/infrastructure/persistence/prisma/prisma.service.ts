import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '../../config/env.config';

/**
 * PrismaService — NestJS wrapper for PrismaClient.
 *
 * Singleton that manages the database connection lifecycle.
 * Uses lazy connection (connects on first use).
 *
 * NOTE: datasourceUrl is passed explicitly to avoid .env resolution
 * issues in pnpm monorepos where Prisma cannot auto-locate the file.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const config = loadEnvConfig();
    super({
      datasourceUrl: config.databaseUrl,
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
