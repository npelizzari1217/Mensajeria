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
    return jwt.sign(
      { sub: payload.sub, role: payload.role },
      this.secret,
      { expiresIn: options?.expiresIn ?? this.defaultExpiresIn },
    );
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload & { role: string };
    return {
      sub: decoded.sub as string,
      role: decoded.role as any,
    };
  }
}
