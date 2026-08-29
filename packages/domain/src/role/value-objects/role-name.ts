import { Result, ok, err } from '../../shared/result';

/**
 * Characters allowed in a role name: letters (including accented Spanish
 * characters) and spaces. No digits, symbols, or punctuation.
 */
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

/**
 * RoleName Value Object.
 *
 * Represents the human-readable name of a system role.
 * Valid names are between 2 and 50 characters and contain only letters
 * (including accented characters) and spaces.
 */
export class RoleName {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(name: string): Result<RoleName, Error> {
    const trimmed = name?.trim();

    if (!trimmed || trimmed.length < 2) {
      return err(new Error('Role name must be at least 2 characters'));
    }
    if (trimmed.length > 50) {
      return err(new Error('Role name must not exceed 50 characters'));
    }
    if (!NAME_REGEX.test(trimmed)) {
      return err(new Error('Role name may only contain letters and spaces'));
    }

    return ok(new RoleName(trimmed));
  }

  /**
   * Trusted reconstruction from persistence — skips validation.
   */
  static reconstruct(name: string): RoleName {
    return new RoleName(name);
  }

  get(): string {
    return this.value;
  }

  equals(other: RoleName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
