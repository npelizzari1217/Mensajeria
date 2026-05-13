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
  UnauthorizedMessageAccessError,
  NotFoundError,
  ok,
  err,
} from '@mensajeria/domain';
import { GetAttachmentUseCase } from '../../application/attachments/use-cases/get-attachment.use-case';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENDER_ID = '00000000-0000-0000-0000-000000000001';
const RECIPIENT_ID = '00000000-0000-0000-0000-000000000002';
const UNAUTHORIZED_USER = '00000000-0000-0000-0000-000000000009';
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

describe('GetAttachmentUseCase', () => {
  let useCase: GetAttachmentUseCase;
  let mockAttachmentRepo: AttachmentRepository;
  let mockMessageRepo: MessageRepository;

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
      delete: vi.fn(),
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

    useCase = new GetAttachmentUseCase(mockAttachmentRepo, mockMessageRepo);
  });

  // --- Happy path ---

  it('should return attachment metadata for the sender', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, SENDER_ID);

    expect(result.isOk()).toBe(true);
    const response = result.unwrap();
    expect(response.id).toBe(ATTACHMENT_ID);
    expect(response.filename).toBe('document.pdf');
    expect(response.mimeType).toBe('application/pdf');
    expect(response.size).toBe(1024);
    expect(response.messageId).toBe(MESSAGE_ID);
    expect(response.uploadedAt).toBe('2026-05-13T12:00:00.000Z');
  });

  it('should return attachment metadata for a recipient', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, RECIPIENT_ID);

    expect(result.isOk()).toBe(true);
    const response = result.unwrap();
    expect(response.id).toBe(ATTACHMENT_ID);
  });

  // --- Error cases ---

  it('should reject request from an unauthorized user', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, UNAUTHORIZED_USER);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(
      UnauthorizedMessageAccessError,
    );
  });

  it('should return NotFoundError when attachment does not exist', async () => {
    const result = await useCase.execute(
      '660e8400-e29b-41d4-a716-446655409999',
      SENDER_ID,
    );

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(NotFoundError);
  });

  it('should reject invalid attachmentId UUID format', async () => {
    const result = await useCase.execute('not-a-uuid', SENDER_ID);

    expect(result.isErr()).toBe(true);
  });

  it('should reject invalid userId UUID format', async () => {
    const result = await useCase.execute(ATTACHMENT_ID, 'not-a-uuid');

    expect(result.isErr()).toBe(true);
  });
});
