import { UserId } from '../../shared/value-objects/user-id';
import { MessageId } from '../../shared/value-objects/message-id';
import { Subject } from '../../shared/value-objects/subject';
import { MessageBody } from '../../shared/value-objects/message-body';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result, ok, err } from '../../shared/result';
import { MessageRecipient } from './message-recipient';

/**
 * Message entity — aggregate root for the Messaging bounded context.
 *
 * Encapsulates a message with its sender, subject, body, optional
 * parent message (for replies), and a list of recipients.
 *
 * Behavior methods enforce domain invariants:
 * - Sender cannot be a recipient (no self-messaging)
 * - Recipients must be unique
 * - Recipient status transitions through PENDING → DELIVERED → READ
 */
export class Message {
  private constructor(
    private readonly id: MessageId,
    private readonly senderId: UserId,
    private subject: Subject,
    private body: MessageBody,
    private readonly parentMessageId: MessageId | null,
    private readonly createdAt: Timestamp,
    private recipients: MessageRecipient[],
    private readonly _senderName?: string,
  ) {}

  /**
   * Factory for NEW messages.
   * Creates the message and initial MessageRecipient entries.
   */
  static create(
    senderId: UserId,
    subject: Subject,
    body: MessageBody,
    recipientIds: UserId[],
    parentMessageId?: MessageId,
  ): Result<Message, Error> {
    if (recipientIds.length === 0) {
      return err(new Error('Message must have at least one recipient'));
    }

    // Check for self-messaging
    if (recipientIds.some((r) => r.equals(senderId))) {
      return err(new Error('Sender cannot be a recipient of their own message'));
    }

    // Check for duplicate recipients
    const seen = new Set<string>();
    for (const r of recipientIds) {
      const key = r.get();
      if (seen.has(key)) {
        return err(new Error(`Duplicate recipient: ${r.get()}`));
      }
      seen.add(key);
    }

    const id = MessageId.reconstruct(crypto.randomUUID());
    const recipients = recipientIds.map((r) =>
      MessageRecipient.create(id, r),
    );

    return ok(
      new Message(
        id,
        senderId,
        subject,
        body,
        parentMessageId ?? null,
        Timestamp.now(),
        recipients,
      ),
    );
  }

  /**
   * Reconstruction from persistence — skips runtime validation.
   * Use ONLY when restoring from a trusted source (DB).
   */
  static reconstruct(props: MessageProps): Message {
    return new Message(
      props.id,
      props.senderId,
      props.subject,
      props.body,
      props.parentMessageId,
      props.createdAt,
      props.recipients,
      props.senderName,
    );
  }

  // --- Identity ---

  getId(): MessageId {
    return this.id;
  }

  getSenderId(): UserId {
    return this.senderId;
  }

  /**
   * Returns the display name of the sender user.
   * Transient — populated by the mapper from Prisma joins, not persisted.
   */
  getSenderName(): string | undefined {
    return this._senderName;
  }

  getSubject(): Subject {
    return this.subject;
  }

  getBody(): MessageBody {
    return this.body;
  }

  getParentMessageId(): MessageId | null {
    return this.parentMessageId;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  getRecipients(): readonly MessageRecipient[] {
    return [...this.recipients];
  }

  // --- Behavior ---

  /**
   * Adds a recipient to this message.
   * Returns error if the recipient already exists.
   */
  addRecipient(recipientId: UserId): Result<void, Error> {
    if (recipientId.equals(this.senderId)) {
      return err(new Error('Sender cannot be a recipient of their own message'));
    }
    const exists = this.recipients.some((r) =>
      r.getRecipientId().equals(recipientId),
    );
    if (exists) {
      return err(new Error(`Recipient ${recipientId} already added`));
    }
    this.recipients.push(MessageRecipient.create(this.id, recipientId));
    return ok(undefined);
  }

  /**
   * Gets the recipient entry for a given user, if they are a recipient.
   */
  getRecipient(userId: UserId): MessageRecipient | undefined {
    return this.recipients.find((r) => r.getRecipientId().equals(userId));
  }

  /**
   * Checks if the given user is the sender of this message.
   */
  isSender(userId: UserId): boolean {
    return this.senderId.equals(userId);
  }

  /**
   * Checks if the given user is a recipient of this message.
   */
  isRecipient(userId: UserId): boolean {
    return this.recipients.some((r) => r.getRecipientId().equals(userId));
  }

  /**
   * Checks if the given user has access to view this message
   * (either as sender or recipient).
   */
  isAccessibleBy(userId: UserId): boolean {
    return this.isSender(userId) || this.isRecipient(userId);
  }

  /**
   * Returns the count of recipients.
   */
  recipientCount(): number {
    return this.recipients.length;
  }

  equals(other: Message): boolean {
    return this.id.equals(other.id);
  }
}

export interface MessageProps {
  id: MessageId;
  senderId: UserId;
  subject: Subject;
  body: MessageBody;
  parentMessageId: MessageId | null;
  createdAt: Timestamp;
  recipients: MessageRecipient[];
  /** Transient — populated by mapper from Prisma join, not persisted */
  senderName?: string;
}
