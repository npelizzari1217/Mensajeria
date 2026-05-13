import { Result, ok, err } from '../result';

const MAX_LENGTH = 10_000;

/**
 * MessageBody Value Object.
 *
 * Validates message body length constraints (max 10,000 chars).
 * Does NOT enforce a minimum — an empty body is allowed (e.g.
 * for messages where the subject is sufficient context).
 */
export class MessageBody {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<MessageBody, Error> {
    if (raw === undefined || raw === null) {
      return err(new Error('Message body cannot be null or undefined'));
    }
    const normalized = raw.trim();
    if (normalized.length > MAX_LENGTH) {
      return err(
        new Error(`Message body must not exceed ${MAX_LENGTH} characters (got ${normalized.length})`),
      );
    }
    return ok(new MessageBody(normalized));
  }

  static reconstruct(raw: string): MessageBody {
    return new MessageBody(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: MessageBody): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
