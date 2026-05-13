import { describe, it, expect } from 'vitest';
import { Attachment } from '../messaging/entities/attachment';
import { FileId } from '../shared/value-objects/file-id';
import { MessageId } from '../shared/value-objects/message-id';

const messageId = MessageId.reconstruct('550e8400-e29b-41d4-a716-446655440000');

describe('FileId', () => {
  describe('create()', () => {
    it('generates a new FileId with a valid UUID', () => {
      const fileId = FileId.create();
      expect(fileId.get()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('generates unique FileIds on each call', () => {
      const a = FileId.create();
      const b = FileId.create();
      expect(a.get()).not.toBe(b.get());
    });
  });

  describe('createFrom()', () => {
    it('creates a FileId from a valid UUID string', () => {
      const uuid = '660e8400-e29b-41d4-a716-446655440001';
      const result = FileId.createFrom(uuid);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().get()).toBe(uuid);
    });

    it('fails on empty string', () => {
      const result = FileId.createFrom('');
      expect(result.isErr()).toBe(true);
    });

    it('fails on malformed UUID', () => {
      const result = FileId.createFrom('not-a-uuid');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs a FileId without validation', () => {
      const fileId = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440002');
      expect(fileId.get()).toBe('660e8400-e29b-41d4-a716-446655440002');
    });
  });

  describe('equals()', () => {
    it('returns true for FileIds with the same value', () => {
      const a = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440003');
      const b = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440003');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for FileIds with different values', () => {
      const a = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440004');
      const b = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440005');
      expect(a.equals(b)).toBe(false);
    });
  });
});

describe('Attachment', () => {
  describe('create()', () => {
    it('creates an attachment with valid inputs', () => {
      const result = Attachment.create('document.pdf', 'application/pdf', 1024, messageId);
      expect(result.isOk()).toBe(true);
      const attachment = result.unwrap();
      expect(attachment.getFilename()).toBe('document.pdf');
      expect(attachment.getMimeType()).toBe('application/pdf');
      expect(attachment.getSize()).toBe(1024);
      expect(attachment.getMessageId().equals(messageId)).toBe(true);
      expect(attachment.getId()).toBeInstanceOf(FileId);
      expect(attachment.getUploadedAt()).toBeInstanceOf(Date);
    });

    it('trims whitespace from filename', () => {
      const result = Attachment.create('  report.txt  ', 'text/plain', 500, messageId);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().getFilename()).toBe('report.txt');
    });

    it('fails with empty filename', () => {
      const result = Attachment.create('', 'text/plain', 500, messageId);
      expect(result.isErr()).toBe(true);
    });

    it('fails with whitespace-only filename', () => {
      const result = Attachment.create('   ', 'text/plain', 500, messageId);
      expect(result.isErr()).toBe(true);
    });

    it('fails with size zero', () => {
      const result = Attachment.create('empty.txt', 'text/plain', 0, messageId);
      expect(result.isErr()).toBe(true);
    });

    it('fails with negative size', () => {
      const result = Attachment.create('negative.txt', 'text/plain', -100, messageId);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs an attachment from persistence', () => {
      const id = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440010');
      const uploadedAt = new Date('2025-06-01T12:00:00Z');

      const attachment = Attachment.reconstruct({
        id,
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        messageId,
        uploadedAt,
      });

      expect(attachment.getId().equals(id)).toBe(true);
      expect(attachment.getFilename()).toBe('photo.jpg');
      expect(attachment.getMimeType()).toBe('image/jpeg');
      expect(attachment.getSize()).toBe(2048);
      expect(attachment.getMessageId().equals(messageId)).toBe(true);
      expect(attachment.getUploadedAt()).toEqual(uploadedAt);
    });
  });

  describe('equals()', () => {
    it('returns true for attachments with the same FileId', () => {
      const id = FileId.reconstruct('660e8400-e29b-41d4-a716-446655440020');
      const a = Attachment.reconstruct({
        id,
        filename: 'a.txt',
        mimeType: 'text/plain',
        size: 100,
        messageId,
        uploadedAt: new Date(),
      });
      const b = Attachment.reconstruct({
        id,
        filename: 'b.txt', // different filename but same id
        mimeType: 'text/plain',
        size: 200,
        messageId,
        uploadedAt: new Date(),
      });
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for attachments with different FileIds', () => {
      const a = Attachment.reconstruct({
        id: FileId.reconstruct('660e8400-e29b-41d4-a716-446655440030'),
        filename: 'a.txt',
        mimeType: 'text/plain',
        size: 100,
        messageId,
        uploadedAt: new Date(),
      });
      const b = Attachment.reconstruct({
        id: FileId.reconstruct('660e8400-e29b-41d4-a716-446655440031'),
        filename: 'a.txt',
        mimeType: 'text/plain',
        size: 100,
        messageId,
        uploadedAt: new Date(),
      });
      expect(a.equals(b)).toBe(false);
    });
  });
});
