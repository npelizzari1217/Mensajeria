import { UserId } from '../../shared/value-objects/user-id';
import { MessageId } from '../../shared/value-objects/message-id';
import { MessageStatusVO } from '../../shared/value-objects/message-status';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result } from '../../shared/result';
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
export declare class MessageRecipient {
    private readonly messageId;
    private readonly recipientId;
    private status;
    private receivedAt;
    private readAt;
    private readonly createdAt;
    private readonly _recipientName?;
    private constructor();
    static create(messageId: MessageId, recipientId: UserId): MessageRecipient;
    static reconstruct(props: MessageRecipientProps): MessageRecipient;
    getMessageId(): MessageId;
    getRecipientId(): UserId;
    getStatus(): MessageStatusVO;
    getReceivedAt(): Timestamp | null;
    getReadAt(): Timestamp | null;
    getCreatedAt(): Timestamp;
    /**
     * Returns the display name of the recipient user.
     * Transient — populated by the mapper from Prisma joins, not persisted.
     */
    getRecipientName(): string | undefined;
    /**
     * Marks the message as delivered to this recipient.
     * No-op if already in DELIVERED or READ state.
     */
    markAsDelivered(): Result<void, Error>;
    /**
     * Marks the message as read by this recipient.
     * Idempotent — calling twice keeps the original readAt.
     */
    markAsRead(): Result<void, Error>;
    /**
     * Checks if this recipient has read the message.
     */
    hasRead(): boolean;
    equals(other: MessageRecipient): boolean;
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
//# sourceMappingURL=message-recipient.d.ts.map