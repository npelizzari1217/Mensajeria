import * as jwt from 'jsonwebtoken';
import { AuthPort, TokenPayload, SignOptions } from '../../application/auth/ports/auth-port';

/**
 * JwtAuthPort — infrastructure adapter implementing AuthPort.
 *
 * Uses the jsonwebtoken library for JWT signing and verification.
 * Configurable via constructor (secret, default expiresIn).
 */
export class JwtAuthPort implements AuthPort {
  constructor(
    private readonly secret: string,
    private readonly defaultExpiresIn: string,
  ) {}

  sign(payload: TokenPayload, options?: SignOptions): string {
    const jwtPayload: any = {
      sub: payload.sub,
      role: payload.role,         // numeric roleId
      roleName: payload.roleName, // human-readable name
    };
    if (payload.empresaId) {
      jwtPayload.empresaId = payload.empresaId;
    }
    return jwt.sign(
      jwtPayload,
      this.secret,
      { expiresIn: options?.expiresIn ?? this.defaultExpiresIn } as jwt.SignOptions,
    );
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload & {
      role: number;
      roleName: string;
      empresaId?: string;
    };
    return {
      sub: decoded.sub as string,
      role: decoded.role as number,
      roleName: decoded.roleName as string,
      empresaId: decoded.empresaId,
    };
  }
}
