/**
 * LogoutUseCase.
 *
 * Revokes all active refresh tokens for a user, effectively
 * logging them out of all sessions. The access token may still
 * be valid until it expires (short-lived), but no new access
 * tokens can be issued via refresh.
 */
import { RefreshTokenRepository } from '@mensajeria/domain';

export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.refreshTokenRepo.deleteByUserId(userId);
  }
}
