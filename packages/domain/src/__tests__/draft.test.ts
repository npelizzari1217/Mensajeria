import { describe, it, expect } from 'vitest';
import { Draft } from '../messaging/entities/draft';
import { UserId } from '../shared/value-objects/user-id';

describe('Draft', () => {
  const userId = UserId.reconstruct('user-1');
  const userId2 = UserId.reconstruct('user-2');

  describe('create', () => {
    it('should create a draft with required fields', () => {
      const result = Draft.create({
        userId,
        body: 'Hello, this is a draft message',
      });
      expect(result.isOk()).toBe(true);
      const draft = result.unwrap();
      expect(draft.getBody()).toBe('Hello, this is a draft message');
      expect(draft.getUserId().equals(userId)).toBe(true);
      expect(draft.getSubject()).toBeNull();
      expect(draft.getRecipientIds()).toEqual([]);
      expect(draft.getGroupId()).toBeNull();
      expect(draft.getId()).toBeTruthy();
    });

    it('should create a draft with all fields', () => {
      const result = Draft.create({
        userId,
        subject: 'Draft subject',
        body: 'Draft body content',
        recipientIds: ['recipient-1', 'recipient-2'],
        groupId: 'group-1',
      });
      expect(result.isOk()).toBe(true);
      const draft = result.unwrap();
      expect(draft.getSubject()).toBe('Draft subject');
      expect(draft.getBody()).toBe('Draft body content');
      expect(draft.getRecipientIds()).toEqual(['recipient-1', 'recipient-2']);
      expect(draft.getGroupId()).toBe('group-1');
    });

    it('should reject empty body', () => {
      const result = Draft.create({
        userId,
        body: '',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should reject whitespace-only body', () => {
      const result = Draft.create({
        userId,
        body: '   ',
      });
      expect(result.isErr()).toBe(true);
    });

    it('should trim body', () => {
      const result = Draft.create({
        userId,
        body: '  trimmed body  ',
      });
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().getBody()).toBe('trimmed body');
    });
  });

  describe('update', () => {
    it('should return a new draft with updated fields', () => {
      const draft = Draft.create({
        userId,
        body: 'Original body',
      }).unwrap();

      const updated = draft.update({ body: 'Updated body', subject: 'New subject' });
      
      // Original unchanged
      expect(draft.getBody()).toBe('Original body');
      expect(draft.getSubject()).toBeNull();
      
      // Updated has new values
      expect(updated.getBody()).toBe('Updated body');
      expect(updated.getSubject()).toBe('New subject');
      
      // Same id, same user
      expect(updated.getId()).toBe(draft.getId());
      expect(updated.getUserId().equals(draft.getUserId())).toBe(true);
    });

    it('should not mutate original on update', () => {
      const draft = Draft.create({
        userId,
        body: 'Original',
        recipientIds: ['rec-1'],
      }).unwrap();

      draft.update({ recipientIds: ['rec-2'] });
      
      expect(draft.getRecipientIds()).toEqual(['rec-1']);
    });
  });

  describe('canBeSent', () => {
    it('should return true when draft has body and recipients', () => {
      const draft = Draft.create({
        userId,
        body: 'Ready to send',
        recipientIds: ['rec-1'],
      }).unwrap();
      expect(draft.canBeSent()).toBe(true);
    });

    it('should return true when draft has body and groupId', () => {
      const draft = Draft.create({
        userId,
        body: 'Ready to send',
        groupId: 'group-1',
      }).unwrap();
      expect(draft.canBeSent()).toBe(true);
    });

    it('should return false when draft has only body', () => {
      const draft = Draft.create({
        userId,
        body: 'No recipients yet',
      }).unwrap();
      expect(draft.canBeSent()).toBe(false);
    });
  });

  describe('reconstruct', () => {
    it('should restore a draft from persistence', () => {
      const original = Draft.create({
        userId,
        subject: 'Test',
        body: 'Test body',
        recipientIds: ['rec-1'],
      }).unwrap();

      const reconstructed = Draft.reconstruct({
        id: original.getId(),
        userId: original.getUserId(),
        subject: original.getSubject(),
        body: original.getBody(),
        recipientIds: [...original.getRecipientIds()],
        groupId: original.getGroupId(),
        createdAt: original.getCreatedAt(),
        updatedAt: original.getUpdatedAt(),
      });

      expect(reconstructed.equals(original)).toBe(true);
      expect(reconstructed.getBody()).toBe(original.getBody());
    });
  });

  describe('equals', () => {
    it('should identify same draft by id', () => {
      const draft1 = Draft.create({ userId, body: 'A' }).unwrap();
      const draft2 = Draft.reconstruct({
        id: draft1.getId(),
        userId,
        subject: null,
        body: 'Different body',
        recipientIds: [],
        groupId: null,
        createdAt: draft1.getCreatedAt(),
        updatedAt: draft1.getUpdatedAt(),
      });
      expect(draft1.equals(draft2)).toBe(true);
    });
  });
});
