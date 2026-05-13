import { Result, ok, err } from '../result';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * FileId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a file attachment.
 * Unlike UserId/MessageId, create() generates a new UUID — consumers
 * do not supply their own ID; the domain owns identity generation.
 */
export class FileId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Factory for NEW file identities.
   * Generates a cryptographically random UUID v4 — no input needed.
   */
  static create(): FileId {
    return new FileId(crypto.randomUUID());
  }

  /**
   * Factory for NEW file identities from a provided UUID string.
   * Validates the format before constructing.
   */
  static createFrom(raw: string): Result<FileId, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('FileId cannot be empty'));
    }
    if (!UUID_REGEX.test(raw.trim())) {
      return err(new Error(`Invalid FileId format: '${raw}' is not a valid UUID`));
    }
    return ok(new FileId(raw.trim()));
  }

  /**
   * Trusted reconstruction for persistence — skips validation.
   * Use ONLY when restoring from a trusted source (DB, event store).
   */
  static reconstruct(raw: string): FileId {
    return new FileId(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: FileId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
