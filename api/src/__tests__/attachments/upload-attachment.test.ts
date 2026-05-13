import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  FileId,
  MessageId,
  UserId,
  Subject,
  MessageBody,
  Timestamp,
  Message,
  MessageRecipient,
  MessageStatus,
  MessageStatusVO,
  AttachmentRepository,
  MessageRepository,
  IFileStorage,
  UnauthorizedMessageAccessError,
  NotFoundError,
  ok,
  err,
} from '@mensajeria/domain';
import { UploadAttachmentUseCase } from '../../application/attachments/use-cases/upload-attachment.use-case';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENDER_ID = '00000000-0000-0000-0000-000000000001';
const RECIPIENT_ID = '00000000-0000-0000-0000-000000000002';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000009';
const MESSAGE_ID = '00000000-0000-0000-0000-000000000010';
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeMessage(
  id: string,
  senderId: string,
  recipientIds: string[],
): Message {
  return Message.reconstruct({
    id: MessageId.reconstruct(id),
    senderId: UserId.reconstruct(senderId),
    subject: Subject.reconstruct('Test Subject'),
    body: MessageBody.reconstruct('Test body'),
    parentMessageId: null,
    createdAt: Timestamp.now(),
    recipients: recipientIds.map((rid) =>
      MessageRecipient.reconstruct({
        messageId: MessageId.reconstruct(id),
        recipientId: UserId.reconstruct(rid),
        status: MessageStatusVO.reconstruct(MessageStatus.Pending),
        receivedAt: null,
        readAt: null,
        createdAt: Timestamp.now(),
      }),
    ),
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('UploadAttachmentUseCase', () => {
  let useCase: UploadAttachmentUseCase;
  let mockMessageRepo: MessageRepository;
  let mockFileStorage: IFileStorage;
  let mockAttachmentRepo: AttachmentRepository;

  const validBuffer = Buffer.from('fake-file-content');
  const validDTO = {
    messageId: MESSAGE_ID,
    filename: 'document.pdf',
    mimeType: 'application/pdf',
    size: 1024,
  };

  beforeEach(() => {
    const messageStore = new Map<string, Message>();
    messageStore.set(
      MESSAGE_ID,
      makeMessage(MESSAGE_ID, SENDER_ID, [RECIPIENT_ID]),
    );

    mockMessageRepo = {
      findById: vi.fn(async (id: MessageId) => {
        const msg = messageStore.get(id.get());
        if (!msg) return err(new NotFoundError('Message', id.get()));
        return ok(msg);
      }),
      findByRecipient: vi.fn(),
      findBySender: vi.fn(),
      save: vi.fn(),
      saveRecipient: vi.fn(),
      findThread: vi.fn(),
    } as any;

    mockFileStorage = {
      upload: vi
        .fn()
        .mockResolvedValue(FileId.reconstruct(VALID_UUID)),
      getUrl: vi.fn(() => `/v1/attachments/${VALID_UUID}`),
      getPath: vi.fn(() => `uploads/${VALID_UUID}`),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any;

    mockAttachmentRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByMessageId: vi.fn(),
      delete: vi.fn(),
    } as any;

    useCase = new UploadAttachmentUseCase(
      mockMessageRepo,
      mockFileStorage,
      mockAttachmentRepo,
    );
  });

  // --- Happy path ---

  it('should upload a file successfully', async () => {
    const result = await useCase.execute(validDTO, validBuffer, SENDER_ID);

    expect(result.isOk()).toBe(true);
    const response = result.unwrap();
    expect(response.filename).toBe('document.pdf');
    expect(response.mimeType).toBe('application/pdf');
    expect(response.size).toBe(1024);
    expect(response.messageId).toBe(MESSAGE_ID);
    expect(response.id).toBe(VALID_UUID);
    expect(response.url).toBe(`/v1/attachments/${VALID_UUID}`);
    expect(response.uploadedAt).toBeDefined();
  });

  it('should persist the attachment via repository', async () => {
    await useCase.execute(validDTO, validBuffer, SENDER_ID);

    expect(mockFileStorage.upload).toHaveBeenCalledTimes(1);
    expect(mockAttachmentRepo.save).toHaveBeenCalledTimes(1);
  });

  // --- Validation ---

  it('should reject oversized files (>10 MB)', async () => {
    const oversized = { ...validDTO, size: 11 * 1024 * 1024 };

    const result = await useCase.execute(oversized, validBuffer, SENDER_ID);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('10 MB');
  });

  it('should reject disallowed MIME types', async () => {
    const badMime = { ...validDTO, mimeType: 'application/x-msdownload' };

    const result = await useCase.execute(badMime, validBuffer, SENDER_ID);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('not allowed');
  });

  it('should accept allowed image MIME types', async () => {
    const imageDto = { ...validDTO, mimeType: 'image/jpeg' };

    const result = await useCase.execute(imageDto, validBuffer, SENDER_ID);

    expect(result.isOk()).toBe(true);
  });

  it('should accept text/plain', async () => {
    const textDto = { ...validDTO, mimeType: 'text/plain' };

    const result = await useCase.execute(textDto, validBuffer, SENDER_ID);

    expect(result.isOk()).toBe(true);
  });

  // --- Access control ---

  it('should reject upload by non-sender', async () => {
    const result = await useCase.execute(validDTO, validBuffer, OTHER_USER_ID);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(
      UnauthorizedMessageAccessError,
    );
  });

  it('should reject upload when message does not exist', async () => {
    const result = await useCase.execute(
      { ...validDTO, messageId: '00000000-0000-0000-0000-000000009999' },
      validBuffer,
      SENDER_ID,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(NotFoundError);
  });

  it('should reject invalid messageId UUID format', async () => {
    const result = await useCase.execute(
      { ...validDTO, messageId: 'not-a-uuid' },
      validBuffer,
      SENDER_ID,
    );

    expect(result.isErr()).toBe(true);
  });

  it('should reject invalid userId UUID format', async () => {
    const result = await useCase.execute(validDTO, validBuffer, 'not-a-uuid');

    expect(result.isErr()).toBe(true);
  });

  // --- Cleanup on failure ---

  it('should clean up file if attachment creation fails', async () => {
    // Mock Attachment.create to fail by passing empty filename
    const result = await useCase.execute(
      { ...validDTO, filename: '' },
      validBuffer,
      SENDER_ID,
    );

    expect(result.isErr()).toBe(true);
    // File should have been cleaned up
    expect(mockFileStorage.delete).toHaveBeenCalled();
  });
});
