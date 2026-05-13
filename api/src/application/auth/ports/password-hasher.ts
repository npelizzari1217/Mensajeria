/**
 * PasswordHasher — application port for password hashing.
 *
 * Defines the contract for one-way hashing and constant-time comparison.
 * Implementation belongs in infrastructure/ (BcryptPasswordHasher).
 */
export interface PasswordHasher {
  /**
   * Hashes a plaintext password using a secure one-way algorithm.
   */
  hash(plain: string): Promise<string>;

  /**
   * Compares a plaintext password against a previously hashed value.
   * MUST be constant-time to prevent timing attacks.
   */
  compare(plain: string, hash: string): Promise<boolean>;
}
