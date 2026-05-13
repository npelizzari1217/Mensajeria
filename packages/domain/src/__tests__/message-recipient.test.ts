import { describe, it, expect } from 'vitest';
import { MessageRecipient } from '../messaging/entities/message-recipient';
import { MessageId } from '../shared/value-objects/message-id';
import { UserId } from '../shared/value-objects/user-id';
import { MessageStatus, MessageStatusVO } from '../shared/value-objects/message-status';
import { Timestamp } from '../shared/value-objects/timestamp';

const messageId = MessageId.create('550e8400-e29b-41d4-a716-446655440000').unwrap();
const recipientId = UserId.create('550e8400-e29b-41d4-a716-446655440001').unwrap();
const anotherUserId = UserId.create('550e8400-e29b-41d4-a716-446655440002').unwrap();

function createRecipient(): MessageRecipient {
  return MessageRecipient.create(messageId, recipientId);
}

describe('MessageRecipient', () => {
  describe('create()', () => {
    it('creates with Pending status', () => {
      const r = createRecipient();
      expect(r.getStatus().get()).toBe(MessageStatus.Pending);
      expect(r.getMessageId().equals(messageId)).toBe(true);
      expect(r.getRecipientId().equals(recipientId)).toBe(true);
      expect(r.getReceivedAt()).toBeNull();
      expect(r.getReadAt()).toBeNull();
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs from persistence data', () => {
      const createdAt = Timestamp.reconstruct('2025-01-15T10:30:00Z');
      const receivedAt = Timestamp.reconstruct('2025-01-15T10:31:00Z');
      const status = MessageStatusVO.reconstruct(MessageStatus.Delivered);

      const r = MessageRecipient.reconstruct({
        messageId,
        recipientId,
        status,
        receivedAt,
        readAt: null,
        createdAt,
      });

      expect(r.getStatus().equals(status)).toBe(true);
      expect(r.getReceivedAt()?.equals(receivedAt)).toBe(true);
      expect(r.getReadAt()).toBeNull();
    });
  });

  describe('markAsDelivered()', () => {
    it('transitions from Pending to Delivered', () => {
      const r = createRecipient();
      const result = r.markAsDelivered();
      expect(result.isOk()).toBe(true);
      expect(r.getStatus().get()).toBe(MessageStatus.Delivered);
      expect(r.getReceivedAt()).not.toBeNull();
    });

    it('is idempotent when already Delivered', () => {
      const r = createRecipient();
      r.markAsDelivered();
      const result = r.markAsDelivered();
      expect(result.isOk()).toBe(true);
      expect(r.getStatus().get()).toBe(MessageStatus.Delivered);
    });

    it('fails if already Read', () => {
      const r = createRecipient();
      r.markAsRead();
      const result = r.markAsDelivered();
      expect(result.isErr()).toBe(true);
    });
  });

  describe('markAsRead()', () => {
    it('transitions from Pending to Read', () => {
      const r = createRecipient();
      const result = r.markAsRead();
      expect(result.isOk()).toBe(true);
      expect(r.getStatus().get()).toBe(MessageStatus.Read);
      expect(r.getReadAt()).not.toBeNull();
      // receivedAt should also be set since it was never delivered
      expect(r.getReceivedAt()).not.toBeNull();
    });

    it('transitions from Delivered to Read', () => {
      const r = createRecipient();
      r.markAsDelivered();
      const result = r.markAsRead();
      expect(result.isOk()).toBe(true);
      expect(r.getStatus().get()).toBe(MessageStatus.Read);
      expect(r.getReadAt()).not.toBeNull();
    });

    it('is idempotent when already Read', () => {
      const r = createRecipient();
      r.markAsRead();
      const firstReadAt = r.getReadAt();

      r.markAsRead();
      expect(r.getStatus().get()).toBe(MessageStatus.Read);
      expect(r.getReadAt()).toBe(firstReadAt); // preserves original readAt
    });
  });

  describe('hasRead()', () => {
    it('returns false initially', () => {
      const r = createRecipient();
      expect(r.hasRead()).toBe(false);
    });

    it('returns true after markAsRead', () => {
      const r = createRecipient();
      r.markAsRead();
      expect(r.hasRead()).toBe(true);
    });
  });

  describe('equals()', () => {
    it('compares by messageId and recipientId', () => {
      const a = MessageRecipient.create(messageId, recipientId);
      const b = MessageRecipient.create(messageId, recipientId);
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different recipient', () => {
      const a = MessageRecipient.create(messageId, recipientId);
      const b = MessageRecipient.create(messageId, anotherUserId);
      expect(a.equals(b)).toBe(false);
    });
  });
});
