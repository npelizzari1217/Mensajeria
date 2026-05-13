import { Result, ok, err } from '../result';

/**
 * Minimal RFC 5322 email regex — covers ~99% of real-world addresses.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email Value Object.
 *
 * Validates format and stores normalized (lowercased) value.
 * Comparison is case-insensitive by design.
 */
export class Email {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<Email, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('Email cannot be empty'));
    }
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      return err(new Error(`Invalid email format: '${raw}'`));
    }
    if (normalized.length > 254) {
      return err(new Error('Email must not exceed 254 characters'));
    }
    return ok(new Email(normalized));
  }

  static reconstruct(raw: string): Email {
    return new Email(raw.toLowerCase());
  }

  get(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
