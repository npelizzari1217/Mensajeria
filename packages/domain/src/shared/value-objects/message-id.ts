import { Result, ok, err } from '../result';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * MessageId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a message.
 */
export class MessageId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<MessageId, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('MessageId cannot be empty'));
    }
    if (!UUID_REGEX.test(raw.trim())) {
      return err(new Error(`Invalid MessageId format: '${raw}' is not a valid UUID`));
    }
    return ok(new MessageId(raw.trim()));
  }

  static reconstruct(raw: string): MessageId {
    return new MessageId(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
