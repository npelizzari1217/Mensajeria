import { Injectable } from '@nestjs/common';
import { DomainEvent, MessageSent, MessageRead } from '@mensajeria/domain';
import { MessagingGateway, MessageNewPayload, MessageReadPayload } from '../../../presentation/messaging/messaging.gateway';

/**
 * WebSocketHandler — bridges domain events to real-time WebSocket emits.
 *
 * Subscribes to `MessageSent` and `MessageRead` events from the EventBus
 * and forwards them to the appropriate user rooms via MessagingGateway.
 */
@Injectable()
export class WebSocketHandler {
  constructor(private readonly gateway: MessagingGateway) {}

  handle(event: DomainEvent): void {
    if (event instanceof MessageSent) {
      this.handleMessageSent(event);
    } else if (event instanceof MessageRead) {
      this.handleMessageRead(event);
    }
  }

  private handleMessageSent(event: MessageSent): void {
    const payload: MessageNewPayload = {
      messageId: event.messageId.get(),
      senderId: event.senderId.get(),
    };

    for (const recipientId of event.recipientIds) {
      this.gateway.emitMessageNew(recipientId.get(), payload);
    }
  }

  private handleMessageRead(event: MessageRead): void {
    const payload: MessageReadPayload = {
      messageId: event.messageId.get(),
      readAt: event.readAt.toString(),
    };

    this.gateway.emitMessageRead(event.recipientId.get(), payload);
  }
}
