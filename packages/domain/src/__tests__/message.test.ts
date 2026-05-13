import { describe, it, expect } from 'vitest';
import { Message } from '../messaging/entities/message';
import { MessageRecipient } from '../messaging/entities/message-recipient';
import { UserId } from '../shared/value-objects/user-id';
import { Subject } from '../shared/value-objects/subject';
import { MessageBody } from '../shared/value-objects/message-body';
import { MessageId } from '../shared/value-objects/message-id';
import { MessageStatus } from '../shared/value-objects/message-status';
import { Timestamp } from '../shared/value-objects/timestamp';

const senderId = UserId.create('550e8400-e29b-41d4-a716-446655440000').unwrap();
const recipientId1 = UserId.create('550e8400-e29b-41d4-a716-446655440001').unwrap();
const recipientId2 = UserId.create('550e8400-e29b-41d4-a716-446655440002').unwrap();
const subject = Subject.create('Test Subject').unwrap();
const body = MessageBody.create('Test body content').unwrap();

describe('Message', () => {
  describe('create()', () => {
    it('creates a message with recipients', () => {
      const result = Message.create(senderId, subject, body, [recipientId1]);
      expect(result.isOk()).toBe(true);
      const message = result.unwrap();
      expect(message.getSenderId().equals(senderId)).toBe(true);
      expect(message.getSubject().equals(subject)).toBe(true);
      expect(message.getBody().equals(body)).toBe(true);
      expect(message.recipientCount()).toBe(1);
      expect(message.getId()).toBeInstanceOf(MessageId);
    });

    it('creates a message with multiple recipients', () => {
      const result = Message.create(senderId, subject, body, [recipientId1, recipientId2]);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().recipientCount()).toBe(2);
    });

    it('fails with no recipients', () => {
      const result = Message.create(senderId, subject, body, []);
      expect(result.isErr()).toBe(true);
    });

    it('fails if sender is also a recipient', () => {
      const result = Message.create(senderId, subject, body, [senderId]);
      expect(result.isErr()).toBe(true);
    });

    it('fails with duplicate recipients', () => {
      const result = Message.create(senderId, subject, body, [recipientId1, recipientId1]);
      expect(result.isErr()).toBe(true);
    });

    it('supports parentMessageId for replies', () => {
      const parentId = MessageId.create('660e8400-e29b-41d4-a716-446655440000').unwrap();
      const result = Message.create(senderId, subject, body, [recipientId1], parentId);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().getParentMessageId()?.equals(parentId)).toBe(true);
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs a message from persistence', () => {
      const msgId = MessageId.reconstruct('660e8400-e29b-41d4-a716-446655440000');
      const createdAt = Timestamp.reconstruct('2025-01-15T10:30:00Z');
      const recipient = MessageRecipient.create(msgId, recipientId1);

      const message = Message.reconstruct({
        id: msgId,
        senderId,
        subject,
        body,
        parentMessageId: null,
        createdAt,
        recipients: [recipient],
      });

      expect(message.getId().equals(msgId)).toBe(true);
      expect(message.recipientCount()).toBe(1);
      expect(message.isSender(senderId)).toBe(true);
      expect(message.isRecipient(recipientId1)).toBe(true);
    });
  });

  describe('addRecipient()', () => {
    it('adds a new recipient', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      const result = message.addRecipient(recipientId2);
      expect(result.isOk()).toBe(true);
      expect(message.recipientCount()).toBe(2);
    });

    it('fails if recipient already exists', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      const result = message.addRecipient(recipientId1);
      expect(result.isErr()).toBe(true);
    });

    it('fails if adding sender as recipient', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      const result = message.addRecipient(senderId);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('isAccessibleBy()', () => {
    it('allows sender access', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      expect(message.isAccessibleBy(senderId)).toBe(true);
    });

    it('allows recipient access', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      expect(message.isAccessibleBy(recipientId1)).toBe(true);
    });

    it('denies access to unrelated user', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      const stranger = UserId.create('550e8400-e29b-41d4-a716-446655440099').unwrap();
      expect(message.isAccessibleBy(stranger)).toBe(false);
    });
  });

  describe('getRecipient()', () => {
    it('returns recipient if they exist', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      const recipient = message.getRecipient(recipientId1);
      expect(recipient).toBeDefined();
      expect(recipient!.getRecipientId().equals(recipientId1)).toBe(true);
    });

    it('returns undefined for non-recipient', () => {
      const message = Message.create(senderId, subject, body, [recipientId1]).unwrap();
      expect(message.getRecipient(recipientId2)).toBeUndefined();
    });
  });
});
