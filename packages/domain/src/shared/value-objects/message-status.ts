import { Result, ok, err } from '../result';

/**
 * MessageStatus enum — delivery lifecycle of a message to a recipient.
 *
 * PENDING  → initial state when message is sent
 * DELIVERED → recipient has received it (server-delivered)
 * READ     → recipient has opened/read it
 */
export enum MessageStatus {
  Pending = 'Pending',
  Sent = 'Sent',
  Delivered = 'Delivered',
  Read = 'Read',
}

const VALID_STATUSES = Object.values(MessageStatus) as string[];

/**
 * MessageStatus Value Object.
 *
 * Wraps a MessageStatus enum with safe construction.
 * Ensures only valid delivery states are represented.
 */
export class MessageStatusVO {
  private constructor(private readonly value: MessageStatus) {
    Object.freeze(this);
  }

  static create(raw: string): Result<MessageStatusVO, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('MessageStatus cannot be empty'));
    }
    const normalized = raw.trim();
    const match = VALID_STATUSES.find(
      (s) => s.toLowerCase() === normalized.toLowerCase(),
    );
    if (!match) {
      return err(
        new Error(
          `Invalid MessageStatus '${raw}'. Valid: ${VALID_STATUSES.join(', ')}`,
        ),
      );
    }
    return ok(new MessageStatusVO(match as MessageStatus));
  }

  static reconstruct(raw: string): MessageStatusVO {
    return new MessageStatusVO(raw as MessageStatus);
  }

  get(): MessageStatus {
    return this.value;
  }

  equals(other: MessageStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static pending(): MessageStatusVO {
    return new MessageStatusVO(MessageStatus.Pending);
  }
}
