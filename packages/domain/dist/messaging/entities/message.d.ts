import { UserId } from '../../shared/value-objects/user-id';
import { EmpresaId } from '../../shared/value-objects/empresa-id';
import { MessageId } from '../../shared/value-objects/message-id';
import { Subject } from '../../shared/value-objects/subject';
import { MessageBody } from '../../shared/value-objects/message-body';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result } from '../../shared/result';
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
export declare class Message {
    private readonly id;
    private readonly senderId;
    private readonly empresaId;
    private subject;
    private body;
    private readonly parentMessageId;
    private readonly createdAt;
    private recipients;
    private readonly _senderName?;
    private constructor();
    /**
     * Factory for NEW messages.
     * Creates the message and initial MessageRecipient entries.
     */
    static create(senderId: UserId, empresaId: EmpresaId, subject: Subject, body: MessageBody, recipientIds: UserId[], parentMessageId?: MessageId): Result<Message, Error>;
    /**
     * Reconstruction from persistence — skips runtime validation.
     * Use ONLY when restoring from a trusted source (DB).
     */
    static reconstruct(props: MessageProps): Message;
    getId(): MessageId;
    getSenderId(): UserId;
    getEmpresaId(): EmpresaId;
    /**
     * Returns the display name of the sender user.
     * Transient — populated by the mapper from Prisma joins, not persisted.
     */
    getSenderName(): string | undefined;
    getSubject(): Subject;
    getBody(): MessageBody;
    getParentMessageId(): MessageId | null;
    getCreatedAt(): Timestamp;
    getRecipients(): readonly MessageRecipient[];
    /**
     * Adds a recipient to this message.
     * Returns error if the recipient already exists.
     */
    addRecipient(recipientId: UserId): Result<void, Error>;
    /**
     * Gets the recipient entry for a given user, if they are a recipient.
     */
    getRecipient(userId: UserId): MessageRecipient | undefined;
    /**
     * Checks if the given user is the sender of this message.
     */
    isSender(userId: UserId): boolean;
    /**
     * Checks if the given user is a recipient of this message.
     */
    isRecipient(userId: UserId): boolean;
    /**
     * Checks if the given user has access to view this message
     * (either as sender or recipient).
     */
    isAccessibleBy(userId: UserId): boolean;
    /**
     * Returns the count of recipients.
     */
    recipientCount(): number;
    equals(other: Message): boolean;
}
export interface MessageProps {
    id: MessageId;
    senderId: UserId;
    empresaId: EmpresaId;
    subject: Subject;
    body: MessageBody;
    parentMessageId: MessageId | null;
    createdAt: Timestamp;
    recipients: MessageRecipient[];
    /** Transient — populated by mapper from Prisma join, not persisted */
    senderName?: string;
}
//# sourceMappingURL=message.d.ts.map