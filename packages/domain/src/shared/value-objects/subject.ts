import { Result, ok, err } from '../result';

const MIN_LENGTH = 1;
const MAX_LENGTH = 200;

/**
 * Subject Value Object.
 *
 * Validates message subject length constraints (1–200 chars).
 * Trims whitespace and normalizes internal spacing.
 */
export class Subject {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<Subject, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('Subject cannot be empty'));
    }
    const normalized = raw.trim().replace(/\s+/g, ' ');
    if (normalized.length < MIN_LENGTH) {
      return err(new Error(`Subject must be at least ${MIN_LENGTH} character(s)`));
    }
    if (normalized.length > MAX_LENGTH) {
      return err(
        new Error(`Subject must not exceed ${MAX_LENGTH} characters (got ${normalized.length})`),
      );
    }
    return ok(new Subject(normalized));
  }

  static reconstruct(raw: string): Subject {
    return new Subject(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: Subject): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
