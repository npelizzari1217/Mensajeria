/**
 * Environment configuration — central access point for all env vars.
 *
 * Loaded at bootstrap and injected into infrastructure adapters.
 * Keeps env var access isolated to a single file.
 */

export interface EnvConfig {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly jwtRefreshExpiresIn: string;
  readonly bcryptRounds: number;
  readonly port: number;
}

export function loadEnvConfig(): EnvConfig {
  return {
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/mensajeria?schema=public',
    jwtSecret: process.env.JWT_SECRET ?? 'super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    port: parseInt(process.env.PORT ?? '3000', 10),
  };
}
