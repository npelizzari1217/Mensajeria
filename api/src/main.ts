import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadEnvConfig } from './infrastructure/config/env.config';

async function bootstrap() {
  const config = loadEnvConfig();

  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('v1');

  // CORS — allow the web frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  // Cookie parser for refresh token
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  await app.listen(config.port);
  console.log(`🚀 API running on http://localhost:${config.port}/v1`);
}

bootstrap();
