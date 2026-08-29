/**
 * Payload stored inside the JWT token.
 */
export interface TokenPayload {
  sub: string;
  role: number;       // numeric roleId
  roleName: string;   // human-readable role name
  empresaId?: string;
}

/**
 * Sign options — allows customizing token expiration.
 */
export interface SignOptions {
  expiresIn?: string;
}

/**
 * AuthPort — application port for JWT operations.
 *
 * Defines the contract for signing and verifying tokens.
 * Implementation belongs in infrastructure/ (JwtAuthPort).
 */
export interface AuthPort {
  /**
   * Signs a payload into a JWT string.
   * Optional expiresIn overrides the default configured in the implementation.
   */
  sign(payload: TokenPayload, options?: SignOptions): string;

  /**
   * Verifies a JWT string and returns the decoded payload.
   * Throws if the token is invalid, expired, or tampered with.
   */
  verify(token: string): TokenPayload;
}
