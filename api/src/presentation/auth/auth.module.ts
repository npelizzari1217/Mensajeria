import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RegisterUserUseCase } from '../../application/auth/use-cases/register-user.use-case';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/auth/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/auth/use-cases/get-current-user.use-case';
import { JwtAuthPort } from '../../infrastructure/auth/jwt-auth-port';
import { BcryptPasswordHasher } from '../../infrastructure/auth/bcrypt-password-hasher';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-refresh-token.repository';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { loadEnvConfig } from '../../infrastructure/config/env.config';

const env = loadEnvConfig();

@Module({
  controllers: [AuthController],
  providers: [
    // ── Application: Use Cases ──────────────────────────────────────
    {
      provide: RegisterUserUseCase,
      useFactory: (repo, hasher, eventBus) => new RegisterUserUseCase(repo, hasher, eventBus),
      inject: ['UserRepository', 'PasswordHasher', 'EventBus'],
    },
    {
      provide: LoginUseCase,
      useFactory: (repo, hasher, authPort, refreshExpiresIn, refreshTokenRepo) =>
        new LoginUseCase(repo, hasher, authPort, refreshExpiresIn, refreshTokenRepo),
      inject: ['UserRepository', 'PasswordHasher', 'AuthPort', 'REFRESH_TOKEN_EXPIRES_IN', 'RefreshTokenRepository'],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (repo, authPort, refreshTokenRepo) =>
        new RefreshTokenUseCase(repo, authPort, refreshTokenRepo),
      inject: ['UserRepository', 'AuthPort', 'RefreshTokenRepository'],
    },
    {
      provide: LogoutUseCase,
      useFactory: (refreshTokenRepo) => new LogoutUseCase(refreshTokenRepo),
      inject: ['RefreshTokenRepository'],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (repo) => new GetCurrentUserUseCase(repo),
      inject: ['UserRepository'],
    },

    // ── Infrastructure: Auth Ports ──────────────────────────────────
    {
      provide: JwtAuthPort,
      useFactory: () => new JwtAuthPort(env.jwtSecret, env.jwtExpiresIn),
    },
    {
      provide: 'AuthPort',
      useExisting: JwtAuthPort,
    },
    {
      provide: BcryptPasswordHasher,
      useFactory: () => new BcryptPasswordHasher(env.bcryptRounds),
    },
    {
      provide: 'PasswordHasher',
      useExisting: BcryptPasswordHasher,
    },
    AuthGuard,

    // ── Infrastructure: Persistence ─────────────────────────────────
    PrismaService,
    {
      provide: PrismaUserRepository,
      useFactory: (prisma) => new PrismaUserRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'UserRepository',
      useExisting: PrismaUserRepository,
    },
    {
      provide: PrismaRefreshTokenRepository,
      useFactory: (prisma) => new PrismaRefreshTokenRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'RefreshTokenRepository',
      useExisting: PrismaRefreshTokenRepository,
    },

    // ── Config values ───────────────────────────────────────────────
    {
      provide: 'REFRESH_TOKEN_EXPIRES_IN',
      useValue: env.jwtRefreshExpiresIn,
    },
  ],
  exports: [
    AuthGuard,
    JwtAuthPort,
    PrismaUserRepository,
    PrismaRefreshTokenRepository,
    PrismaService,
    'AuthPort',
    'UserRepository',
    'RefreshTokenRepository',
  ],
})
export class AuthModule {}
