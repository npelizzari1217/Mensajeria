import { UserId } from '../../shared/value-objects/user-id';
import { MessageId } from '../../shared/value-objects/message-id';
import { MessageStatus, MessageStatusVO } from '../../shared/value-objects/message-status';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result, ok, err } from '../../shared/result';

/**
 * MessageRecipient entity.
 *
 * Tracks the delivery status of a message to a specific recipient.
 * Part of the Message aggregate — created and managed through Message.
 *
 * Status transitions:
 *   PENDING → DELIVERED → READ
 *   PENDING → READ (when message is read before explicit delivery)
 *   Status is idempotent: marking already-Read as Read is a no-op.
 */
export class MessageRecipient {
  private constructor(
    private readonly messageId: MessageId,
    private readonly recipientId: UserId,
    private status: MessageStatusVO,
    private receivedAt: Timestamp | null,
    private readAt: Timestamp | null,
    private readonly createdAt: Timestamp,
    private readonly _recipientName?: string,
  ) {}

  static create(
    messageId: MessageId,
    recipientId: UserId,
  ): MessageRecipient {
    return new MessageRecipient(
      messageId,
      recipientId,
      MessageStatusVO.reconstruct(MessageStatus.Pending),
      null,
      null,
      Timestamp.now(),
    );
  }

  static reconstruct(props: MessageRecipientProps): MessageRecipient {
    return new MessageRecipient(
      props.messageId,
      props.recipientId,
      props.status,
      props.receivedAt ?? null,
      props.readAt ?? null,
      props.createdAt,
      props.recipientName,
    );
  }

  // --- Identity ---

  getMessageId(): MessageId {
    return this.messageId;
  }

  getRecipientId(): UserId {
    return this.recipientId;
  }

  getStatus(): MessageStatusVO {
    return this.status;
  }

  getReceivedAt(): Timestamp | null {
    return this.receivedAt;
  }

  getReadAt(): Timestamp | null {
    return this.readAt;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  /**
   * Returns the display name of the recipient user.
   * Transient — populated by the mapper from Prisma joins, not persisted.
   */
  getRecipientName(): string | undefined {
    return this._recipientName;
  }

  // --- Behavior ---

  /**
   * Marks the message as delivered to this recipient.
   * No-op if already in DELIVERED or READ state.
   */
  markAsDelivered(): Result<void, Error> {
    if (this.status.get() === MessageStatus.Read) {
      return err(new Error('Cannot mark a read message as delivered'));
    }
    if (this.status.get() === MessageStatus.Delivered) {
      return ok(undefined); // idempotent
    }
    this.status = MessageStatusVO.reconstruct(MessageStatus.Delivered);
    this.receivedAt = Timestamp.now();
    return ok(undefined);
  }

  /**
   * Marks the message as read by this recipient.
   * Idempotent — calling twice keeps the original readAt.
   */
  markAsRead(): Result<void, Error> {
    if (this.status.get() === MessageStatus.Read) {
      return ok(undefined); // idempotent — keep original readAt
    }
    this.status = MessageStatusVO.reconstruct(MessageStatus.Read);
    if (!this.receivedAt) {
      this.receivedAt = Timestamp.now();
    }
    this.readAt = Timestamp.now();
    return ok(undefined);
  }

  /**
   * Checks if this recipient has read the message.
   */
  hasRead(): boolean {
    return this.status.get() === MessageStatus.Read;
  }

  equals(other: MessageRecipient): boolean {
    return (
      this.messageId.equals(other.messageId) &&
      this.recipientId.equals(other.recipientId)
    );
  }
}

export interface MessageRecipientProps {
  messageId: MessageId;
  recipientId: UserId;
  status: MessageStatusVO;
  receivedAt: Timestamp | null;
  readAt: Timestamp | null;
  createdAt: Timestamp;
  /** Transient — populated by mapper from Prisma join, not persisted */
  recipientName?: string;
}
