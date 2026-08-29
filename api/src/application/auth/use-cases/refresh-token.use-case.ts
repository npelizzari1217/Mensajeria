/**
 * RefreshTokenUseCase.
 *
 * Validates a refresh token both by JWT signature AND by checking
 * it exists in the database. This allows server-side revocation:
 * deleted tokens are rejected even if their JWT signature is valid.
 */
import {
  UserId,
  RefreshTokenRepository,
  UserRepository,
  UserNotFoundError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { AuthPort } from '../ports/auth-port';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { roleIdToName } from '../role-name-mapper';

export interface RefreshTokenResult {
  accessToken: string;
  user: UserProfileDTO;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly authPort: AuthPort,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(refreshToken: string): Promise<Result<RefreshTokenResult, Error>> {
    // 1. Verify the token exists in the database (not revoked)
    const stored = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!stored) {
      return err(new Error('Invalid or expired refresh token'));
    }

    // 2. Check DB-level expiration (belt and suspenders with JWT expiry)
    if (stored.expiresAt < new Date()) {
      return err(new Error('Invalid or expired refresh token'));
    }

    // 3. Verify the JWT signature / payload
    let payload;
    try {
      payload = this.authPort.verify(refreshToken);
    } catch {
      return err(new Error('Invalid or expired refresh token'));
    }

    // 4. Find the user
    const id = UserId.reconstruct(payload.sub);
    const userResult = await this.userRepo.findById(id);
    if (userResult.isErr()) {
      return err(new UserNotFoundError(payload.sub));
    }
    const user = userResult.unwrap();

    const roleId = user.getRoleId();
    const roleName = roleIdToName(roleId);

    // 5. Sign a new access token
    const newAccessToken = this.authPort.sign({
      sub: user.getId().get(),
      role: roleId,
      roleName,
    });

    // 6. Return
    return ok({
      accessToken: newAccessToken,
      user: {
        id: user.getId().get(),
        email: user.getEmail().get(),
        name: user.getName(),
        role: { id: roleId, name: roleName },
        createdAt: user.getCreatedAt().toString(),
      },
    });
  }
}
