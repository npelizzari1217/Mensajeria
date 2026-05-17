import { DomainEvent } from '../../shared/events/domain-event';
import { MessageId } from '../../shared/value-objects/message-id';
import { UserId } from '../../shared/value-objects/user-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
/**
 * Domain event emitted when a recipient marks a message as read.
 *
 * Handlers can use this to update read receipts, notify senders,
 * or trigger follow-up actions.
 */
export declare class MessageRead implements DomainEvent {
    readonly messageId: MessageId;
    readonly recipientId: UserId;
    readonly readAt: Timestamp;
    readonly eventName = "MessageRead";
    readonly occurredAt: Date;
    constructor(messageId: MessageId, recipientId: UserId, readAt: Timestamp);
}
//# sourceMappingURL=message-read.d.ts.map