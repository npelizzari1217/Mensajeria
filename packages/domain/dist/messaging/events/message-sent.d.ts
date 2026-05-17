import { DomainEvent } from '../../shared/events/domain-event';
import { MessageId } from '../../shared/value-objects/message-id';
import { UserId } from '../../shared/value-objects/user-id';
/**
 * Domain event emitted when a message is successfully sent.
 *
 * Handlers can use this to trigger notifications, update analytics,
 * or process delivery rules.
 */
export declare class MessageSent implements DomainEvent {
    readonly messageId: MessageId;
    readonly senderId: UserId;
    readonly recipientIds: readonly UserId[];
    readonly eventName = "MessageSent";
    readonly occurredAt: Date;
    constructor(messageId: MessageId, senderId: UserId, recipientIds: readonly UserId[]);
}
//# sourceMappingURL=message-sent.d.ts.map