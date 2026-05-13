import { DomainEvent } from '../../shared/events/domain-event';
import { MessageId } from '../../shared/value-objects/message-id';
import { UserId } from '../../shared/value-objects/user-id';

/**
 * Domain event emitted when a message is successfully sent.
 *
 * Handlers can use this to trigger notifications, update analytics,
 * or process delivery rules.
 */
export class MessageSent implements DomainEvent {
  readonly eventName = 'MessageSent';
  readonly occurredAt: Date = new Date();

  constructor(
    readonly messageId: MessageId,
    readonly senderId: UserId,
    readonly recipientIds: readonly UserId[],
  ) {}
}
