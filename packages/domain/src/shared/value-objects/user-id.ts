import { Result, ok, err } from '../result';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * UserId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a user.
 * Validation ensures the value is a well-formed UUID v4.
 */
export class UserId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<UserId, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('UserId cannot be empty'));
    }
    if (!UUID_REGEX.test(raw.trim())) {
      return err(new Error(`Invalid UserId format: '${raw}' is not a valid UUID`));
    }
    return ok(new UserId(raw.trim()));
  }

  /**
   * Trusted reconstruction for persistence — skips validation.
   * Use ONLY when restoring from a trusted source (DB, event store).
   */
  static reconstruct(raw: string): UserId {
    return new UserId(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
