import {
  Email,
  EmpresaId,
  RefreshTokenRepository,
  UserRepository,
  InvalidCredentialsError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { AuthPort, TokenPayload } from '../ports/auth-port';
import { PasswordHasher } from '../ports/password-hasher';
import { LoginDTO } from '../dtos/login.dto';
import { AuthResponseDTO } from '../dtos/auth-response.dto';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { EmpresaDTO } from '../dtos/empresa.dto';

/**
 * LoginUseCase.
 *
 * Authenticates a user with email + password. Returns JWT tokens
 * on success. Uses the SAME error message regardless of whether
 * the email exists (prevents user enumeration).
 *
 * Stores the refresh token in the database so it can be validated
 * and revoked server-side (instead of JWT-only validation).
 */

/**
 * Parses an expires-in string (e.g. '7d', '15m') into a Date.
 */
function parseExpiresIn(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  const ms = value * (multipliers[match[2]] ?? 24 * 60 * 60 * 1000);
  return new Date(Date.now() + ms);
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly authPort: AuthPort,
    private readonly refreshTokenExpiresIn: string,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async execute(dto: LoginDTO): Promise<Result<AuthResponseDTO, Error>> {
    // 1. Validate email format
    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) {
      return err(new InvalidCredentialsError());
    }
    const email = emailResult.unwrap();

    // 2. Find user — same error whether found or not (prevents enumeration)
    const userResult = await this.userRepo.findByEmail(email);
    if (userResult.isErr()) {
      return err(new InvalidCredentialsError());
    }
    const user = userResult.unwrap();

    // 3. Verify password
    const passwordValid = await this.passwordHasher.compare(
      dto.password,
      user.getHashedPassword(),
    );
    if (!passwordValid) {
      return err(new InvalidCredentialsError());
    }

    // 4. Sign access token (default short expiration from adapter)
    const payload: TokenPayload = {
      sub: user.getId().get(),
      role: user.getRole().get(),
    };
    const accessToken = this.authPort.sign(payload);

    // 5. Sign refresh token (longer expiration)
    const refreshToken = this.authPort.sign(payload, {
      expiresIn: this.refreshTokenExpiresIn,
    });

    // 6. Store refresh token in database for server-side validation
    const expiresAt = parseExpiresIn(this.refreshTokenExpiresIn);
    await this.refreshTokenRepo.save({
      token: refreshToken,
      userId: user.getId().get(),
      expiresAt,
    });

    // 7. Get user's empresas
    const empresasResult = await this.userRepo.getEmpresas(user.getId());
    const empresas: EmpresaDTO[] = [];
    if (empresasResult.isOk()) {
      const memberships = empresasResult.unwrap();
      empresas.push(...memberships.map((m) => ({
        id: m.empresaId.get(),
        nombre: m.nombre,
        role: m.role,
      })));
    }

    // 8. Return auth response
    const profile: UserProfileDTO = {
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: user.getRole().get(),
      createdAt: user.getCreatedAt().toString(),
    };

    return ok({
      accessToken,
      refreshToken,
      user: profile,
      empresas,
    });
  }
}
