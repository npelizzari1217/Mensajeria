import { Result, ok, err } from '../../shared/result';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ThreadId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a conversation thread.
 */
export class ThreadId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<ThreadId, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('ThreadId cannot be empty'));
    }
    if (!UUID_REGEX.test(raw.trim())) {
      return err(new Error(`Invalid ThreadId format: '${raw}' is not a valid UUID`));
    }
    return ok(new ThreadId(raw.trim()));
  }

  static reconstruct(raw: string): ThreadId {
    return new ThreadId(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: ThreadId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
