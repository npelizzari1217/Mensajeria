import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnvConfig } from './infrastructure/config/env.config';

async function bootstrap() {
  const config = loadEnvConfig();

  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS — accept a comma-separated list of origins from env.
  // In dev, this typically includes the web frontend, Expo Go (exp://*) and Metro (http://localhost:8081).
  // Example: CORS_ORIGIN=http://localhost:5173,exp://*,http://localhost:8081
  const rawOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const corsOrigins = rawOrigin.includes(',')
    ? rawOrigin.split(',').map((s) => s.trim())
    : rawOrigin;
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Cookie parser for refresh token
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  await app.listen(config.port);
  console.log(`🚀 API running on http://localhost:${config.port}/v1`);
}

bootstrap();
