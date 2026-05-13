/**
 * RefreshTokenRepository port.
 *
 * Defines the contract for persisting and retrieving refresh tokens.
 * Implementation belongs in infrastructure/ (PrismaRefreshTokenRepository).
 *
 * Enables server-side token validation and revocation — without this,
 * refresh tokens can only be verified by JWT signature, which means
 * they cannot be individually revoked (e.g. on logout or compromise).
 */
import { Result } from '../../shared/result';

/**
 * Minimal data shape for a stored refresh token.
 * Not a full domain entity — just the data needed for validation.
 */
export interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt?: Date;
}

export interface RefreshTokenRepository {
  /**
   * Persists a new refresh token.
   */
  save(record: RefreshTokenRecord): Promise<void>;

  /**
   * Looks up a refresh token by its JWT string value.
   * Returns null if the token was never issued or has been revoked (deleted).
   */
  findByToken(token: string): Promise<RefreshTokenRecord | null>;

  /**
   * Deletes all refresh tokens for a given user — used on logout
   * to revoke all active sessions.
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Deletes all expired refresh tokens — used as a cleanup/cron operation.
   */
  deleteExpired(): Promise<void>;
}
