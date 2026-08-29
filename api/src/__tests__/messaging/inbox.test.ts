import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserId,
  User,
  Email,
  Timestamp,
  EmpresaId,
  Message,
  MessageId,
  Subject,
  MessageBody,
  MessageRepository,
  MessageRecipient,
  MessageStatus,
  MessageStatusVO,
  ok,
  err,
} from '@mensajeria/domain';
import { GetInboxUseCase } from '../../application/messaging/use-cases/get-inbox.use-case';
import { GetSentUseCase } from '../../application/messaging/use-cases/get-sent.use-case';

const TEST_EMPRESA_ID = EmpresaId.reconstruct('00000000-0000-0000-0000-000000000001');

function makeMessage(
  id: string,
  senderId: string,
  subject: string,
  body: string,
  recipientIds: string[],
  parentMessageId?: string,
) {
  const recipients = recipientIds.map((rid) =>
    MessageRecipient.reconstruct({
      messageId: MessageId.reconstruct(id),
      recipientId: UserId.reconstruct(rid),
      status: MessageStatusVO.reconstruct(MessageStatus.Pending),
      receivedAt: null,
      readAt: null,
      createdAt: Timestamp.now(),
    }),
  );

  return Message.reconstruct({
    id: MessageId.reconstruct(id),
    senderId: UserId.reconstruct(senderId),
    subject: Subject.reconstruct(subject),
    body: MessageBody.reconstruct(body),
    parentMessageId: parentMessageId ? MessageId.reconstruct(parentMessageId) : null,
    createdAt: Timestamp.now(),
    recipients,
  });
}

// Use dynamic import to handle ESM
describe('GetInboxUseCase', () => {
  let inboxUseCase: GetInboxUseCase;
  let sentUseCase: GetSentUseCase;
  let mockMessageRepo: MessageRepository;

  const userId = '00000000-0000-0000-0000-000000000001';
  const otherUserId = '00000000-0000-0000-0000-000000000002';

  const sampleMessages = [
    makeMessage('msg-1', otherUserId, 'Subject 1', 'Body 1', [userId]),
    makeMessage('msg-2', otherUserId, 'Subject 2', 'Body 2', [userId]),
    makeMessage('msg-3', userId, 'Subject 3', 'Body 3', [otherUserId]),
  ];

  beforeEach(() => {
    mockMessageRepo = {
      findById: vi.fn(),
      findByRecipient: vi.fn(),
      findBySender: vi.fn(),
      save: vi.fn(),
      saveRecipient: vi.fn(),
      findThread: vi.fn(),
    } as any;

    inboxUseCase = new GetInboxUseCase(mockMessageRepo);
    sentUseCase = new GetSentUseCase(mockMessageRepo);
  });

  describe('GetInboxUseCase', () => {
    it('should return paginated inbox messages', async () => {
      (mockMessageRepo.findByRecipient as any).mockResolvedValue(
        ok({
          data: [sampleMessages[0], sampleMessages[1]],
          total: 2,
          page: 1,
          pageSize: 20,
        }),
      );

      const result = await inboxUseCase.execute({
        userId,
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const inbox = result.unwrap();
      expect(inbox.data).toHaveLength(2);
      expect(inbox.total).toBe(2);
      expect(inbox.page).toBe(1);
    });

    it('should return empty array when no messages', async () => {
      (mockMessageRepo.findByRecipient as any).mockResolvedValue(
        ok({ data: [], total: 0, page: 1, pageSize: 20 }),
      );

      const result = await inboxUseCase.execute({
        userId,
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap().data).toHaveLength(0);
      expect(result.unwrap().total).toBe(0);
    });

    it('should enforce max page size of 100', async () => {
      (mockMessageRepo.findByRecipient as any).mockResolvedValue(
        ok({ data: [], total: 0, page: 1, pageSize: 100 }),
      );

      const result = await inboxUseCase.execute({
        userId,
        page: 1,
        pageSize: 999,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      // The pageSize passed to repo should be capped at 100
      // findByRecipient is called with (userId, empresaId, statusFilter, pagination)
      expect(mockMessageRepo.findByRecipient).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId }),
        expect.any(Object), // empresaId
        undefined,
        expect.objectContaining({ pageSize: 100 }),
      );
    });
  });

  describe('GetSentUseCase', () => {
    it('should return paginated sent messages', async () => {
      (mockMessageRepo.findBySender as any).mockResolvedValue(
        ok({
          data: [sampleMessages[2]],
          total: 1,
          page: 1,
          pageSize: 20,
        }),
      );

      const result = await sentUseCase.execute({
        userId,
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const sent = result.unwrap();
      expect(sent.data).toHaveLength(1);
      expect(sent.data[0].senderId).toBe(userId);
    });

    it('should return empty array when no sent messages', async () => {
      (mockMessageRepo.findBySender as any).mockResolvedValue(
        ok({ data: [], total: 0, page: 1, pageSize: 20 }),
      );

      const result = await sentUseCase.execute({
        userId,
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      expect(result.unwrap().data).toHaveLength(0);
    });
  });
});
