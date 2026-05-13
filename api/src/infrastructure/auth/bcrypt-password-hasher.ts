import * as bcrypt from 'bcrypt';
import { PasswordHasher } from '../../application/auth/ports/password-hasher';

/**
 * BcryptPasswordHasher — infrastructure adapter implementing PasswordHasher.
 *
 * Uses bcrypt with configurable salt rounds.
 */
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number = 12) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
