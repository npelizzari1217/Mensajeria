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
export class MessageRead implements DomainEvent {
  readonly eventName = 'MessageRead';
  readonly occurredAt: Date = new Date();

  constructor(
    readonly messageId: MessageId,
    readonly recipientId: UserId,
    readonly readAt: Timestamp,
  ) {}
}
