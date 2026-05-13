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
  Attachment,
  AttachmentRepository,
  MessageRepository,
  IFileStorage,
  UnauthorizedMessageAccessError,
  NotFoundError,
  ok,
  err,
} from '@mensajeria/domain';
import { DeleteAttachmentUseCase } from '../../application/attachments/use-cases/delete-attachment.use-case';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENDER_ID = '00000000-0000-0000-0000-000000000001';
const RECIPIENT_ID = '00000000-0000-0000-0000-000000000002';
const OTHER_USER_ID = '00000000-0000-0000-0000-000000000009';
const ATTACHMENT_ID = '660e8400-e29b-41d4-a716-446655440001';
const MESSAGE_ID = '00000000-0000-0000-0000-000000000010';

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

function makeAttachment(
  id: string,
  messageId: string,
): Attachment {
  return Attachment.reconstruct({
    id: FileId.reconstruct(id),
    filename: 'document.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    messageId: MessageId.reconstruct(messageId),
    uploadedAt: new Date('2026-05-13T12:00:00Z'),
    storagePath: `uploads/${id}`,
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('DeleteAttachmentUseCase', () => {
  let useCase: DeleteAttachmentUseCase;
  let mockAttachmentRepo: AttachmentRepository;
  let mockMessageRepo: MessageRepository;
  let mockFileStorage: IFileStorage;

  beforeEach(() => {
    const messageStore = new Map<string, Message>();
    messageStore.set(
      MESSAGE_ID,
      makeMessage(MESSAGE_ID, SENDER_ID, [RECIPIENT_ID]),
    );

    const attachmentStore = new Map<string, Attachment>();
    attachmentStore.set(
      ATTACHMENT_ID,
      makeAttachment(ATTACHMENT_ID, MESSAGE_ID),
    );

    mockAttachmentRepo = {
      findById: vi.fn(async (id: FileId) => {
        return attachmentStore.get(id.get()) ?? null;
      }),
      save: vi.fn(),
      findByMessageId: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any;

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
      upload: vi.fn(),
      getUrl: vi.fn(),
      getPath: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new DeleteAttachmentUseCase(
      mockAttachmentRepo,
      mockMessageRepo,
      mockFileStorage,
    );
  });

  // --- Happy path ---

  it('should delete an attachment as the sender', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, SENDER_ID);

    expect(result.isOk()).toBe(true);
    expect(mockFileStorage.delete).toHaveBeenCalledTimes(1);
    expect(mockAttachmentRepo.delete).toHaveBeenCalledTimes(1);
  });

  it('should delete file from storage first, then DB record', async () => {
    // Verify order: storage.delete then repo.delete
    let order: string[] = [];
    mockFileStorage.delete = vi.fn().mockImplementation(async () => {
      order.push('storage');
    });
    mockAttachmentRepo.delete = vi.fn().mockImplementation(async () => {
      order.push('repo');
    });

    // Re-create use case with updated mocks
    const uc = new DeleteAttachmentUseCase(
      mockAttachmentRepo,
      mockMessageRepo,
      mockFileStorage,
    );

    await uc.execute(ATTACHMENT_ID, SENDER_ID);

    expect(order).toEqual(['storage', 'repo']);
  });

  // --- Access control ---

  it('should reject delete by a non-sender recipient', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, RECIPIENT_ID);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(
      UnauthorizedMessageAccessError,
    );
  });

  it('should reject delete by an unrelated user', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, OTHER_USER_ID);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(
      UnauthorizedMessageAccessError,
    );
  });

  // --- Not found ---

  it('should return NotFoundError when attachment does not exist', async () => {
    const result = await useCase.execute(
      '660e8400-e29b-41d4-a716-446655409999',
      SENDER_ID,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(NotFoundError);
  });

  // --- Validation ---

  it('should reject invalid attachmentId UUID format', async () => {
    const result = await useCase.execute('not-a-uuid', SENDER_ID);

    expect(result.isErr()).toBe(true);
  });

  it('should reject invalid userId UUID format', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, 'not-a-uuid');

    expect(result.isErr()).toBe(true);
  });
});
