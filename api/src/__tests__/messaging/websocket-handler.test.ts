import { describe, it, expect, vi } from 'vitest';
import { WebSocketHandler } from '../../infrastructure/event-bus/handlers/websocket-handler';
import {
  MessageSent,
  MessageRead,
  MessageId,
  UserId,
  Timestamp,
} from '@mensajeria/domain';

// ── Helpers ───────────────────────────────────────────────────────────────

function createMockGateway() {
  return {
    emitMessageNew: vi.fn(),
    emitMessageRead: vi.fn(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('WebSocketHandler', () => {
  describe('handle — MessageSent', () => {
    it('should emit message:new for each recipient', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const messageId = MessageId.reconstruct('msg-1');
      const senderId = UserId.reconstruct('sender-1');
      const recipientIds = [
        UserId.reconstruct('recip-1'),
        UserId.reconstruct('recip-2'),
      ];

      const event = new MessageSent(messageId, senderId, recipientIds);
      handler.handle(event);

      expect(gateway.emitMessageNew).toHaveBeenCalledTimes(2);
    });

    it('should pass correct payload to gateway.emitMessageNew', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const messageId = MessageId.reconstruct('msg-42');
      const senderId = UserId.reconstruct('sender-99');
      const recipientIds = [UserId.reconstruct('recip-1')];

      const event = new MessageSent(messageId, senderId, recipientIds);
      handler.handle(event);

      expect(gateway.emitMessageNew).toHaveBeenCalledWith('recip-1', {
        messageId: 'msg-42',
        senderId: 'sender-99',
      });
    });

    it('should call emitMessageNew once per recipient with correct IDs', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const messageId = MessageId.reconstruct('msg-1');
      const senderId = UserId.reconstruct('sender-1');
      const recipientIds = [
        UserId.reconstruct('recip-a'),
        UserId.reconstruct('recip-b'),
        UserId.reconstruct('recip-c'),
      ];

      const event = new MessageSent(messageId, senderId, recipientIds);
      handler.handle(event);

      expect(gateway.emitMessageNew).toHaveBeenCalledTimes(3);
      expect(gateway.emitMessageNew).toHaveBeenCalledWith('recip-a', {
        messageId: 'msg-1',
        senderId: 'sender-1',
      });
      expect(gateway.emitMessageNew).toHaveBeenCalledWith('recip-b', {
        messageId: 'msg-1',
        senderId: 'sender-1',
      });
      expect(gateway.emitMessageNew).toHaveBeenCalledWith('recip-c', {
        messageId: 'msg-1',
        senderId: 'sender-1',
      });
    });

    it('should handle message with no recipients gracefully', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const messageId = MessageId.reconstruct('msg-1');
      const senderId = UserId.reconstruct('sender-1');
      const recipientIds: UserId[] = [];

      const event = new MessageSent(messageId, senderId, recipientIds);
      handler.handle(event);

      expect(gateway.emitMessageNew).not.toHaveBeenCalled();
    });
  });

  describe('handle — MessageRead', () => {
    it('should emit message:read with correct payload', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const messageId = MessageId.reconstruct('msg-1');
      const recipientId = UserId.reconstruct('recip-1');
      const readAt = Timestamp.reconstruct('2026-05-14T12:00:00.000Z');

      const event = new MessageRead(messageId, recipientId, readAt);
      handler.handle(event);

      expect(gateway.emitMessageRead).toHaveBeenCalledTimes(1);
      expect(gateway.emitMessageRead).toHaveBeenCalledWith('recip-1', {
        messageId: 'msg-1',
        readAt: '2026-05-14T12:00:00.000Z',
      });
    });

    it('should preserve the original readAt timestamp', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const messageId = MessageId.reconstruct('msg-1');
      const recipientId = UserId.reconstruct('recip-1');
      const readAt = Timestamp.reconstruct('2025-01-01T00:00:00.000Z');

      const event = new MessageRead(messageId, recipientId, readAt);
      handler.handle(event);

      expect(gateway.emitMessageRead).toHaveBeenCalledWith('recip-1', {
        messageId: 'msg-1',
        readAt: '2025-01-01T00:00:00.000Z',
      });
    });
  });

  describe('handle — unknown events', () => {
    it('should not emit anything for unrecognized event types', () => {
      const gateway = createMockGateway();
      const handler = new WebSocketHandler(gateway as any);

      const unknownEvent = {
        eventName: 'UnknownEvent',
        occurredAt: new Date(),
      };

      handler.handle(unknownEvent as any);

      expect(gateway.emitMessageNew).not.toHaveBeenCalled();
      expect(gateway.emitMessageRead).not.toHaveBeenCalled();
    });
  });
});
