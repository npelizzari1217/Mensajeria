import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserId,
  EmpresaId,
  Message,
  MessageId,
  Subject,
  MessageBody,
  MessageRecipient,
  MessageRepository,
  MessageStatus,
  MessageStatusVO,
  ValidationError,
  PaginatedResult,
  ok,
  err,
  EventBus,
  Timestamp,
} from '@mensajeria/domain';
import { SearchMessagesUseCase } from '../../application/messaging/use-cases/search-messages.use-case';

const TEST_EMPRESA_ID = EmpresaId.reconstruct('00000000-0000-0000-0000-000000000001');

function makeMessage(
  id: string,
  senderId: string,
  subject: string,
  body: string,
  recipientIds: string[],
) {
  const recipients = recipientIds.map((rid) =>
    MessageRecipient.reconstruct({
      messageId: MessageId.reconstruct(id),
      recipientId: UserId.reconstruct(rid),
      status: MessageStatusVO.reconstruct(MessageStatus.Delivered),
      receivedAt: Timestamp.now(),
      readAt: null,
      createdAt: Timestamp.now(),
    }),
  );

  return Message.reconstruct({
    id: MessageId.reconstruct(id),
    senderId: UserId.reconstruct(senderId),
    subject: Subject.reconstruct(subject),
    body: MessageBody.reconstruct(body),
    parentMessageId: null,
    createdAt: Timestamp.now(),
    recipients,
  });
}

describe('SearchMessagesUseCase', () => {
  let useCase: SearchMessagesUseCase;
  let mockMessageRepo: MessageRepository;
  let mockEventBus: EventBus;

  const senderId = '00000000-0000-0000-0000-000000000001';
  const recipientId = '00000000-0000-0000-0000-000000000002';

  const msg1 = makeMessage(
    '00000000-0000-0000-0000-000000000010',
    senderId,
    'Proyecto finalizado',
    'El proyecto se ha completado exitosamente',
    [recipientId],
  );

  const msg2 = makeMessage(
    '00000000-0000-0000-0000-000000000011',
    recipientId,
    'Re: Proyecto finalizado',
    'Gracias por la actualización del proyecto',
    [senderId],
  );

  beforeEach(() => {
    mockMessageRepo = {
      save: vi.fn(),
      findById: vi.fn(),
      findByRecipient: vi.fn(),
      findBySender: vi.fn(),
      saveRecipient: vi.fn(),
      findThread: vi.fn(),
      search: vi.fn(),
    } as any;

    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };

    useCase = new SearchMessagesUseCase(mockMessageRepo, mockEventBus);
  });

  describe('validation', () => {
    it('should return ValidationError when query is too short (< 2 chars)', async () => {
      const result = await useCase.execute({
        userId: senderId,
        query: 'a',
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr()).toBeInstanceOf(ValidationError);
      expect(result.unwrapErr().message).toContain('at least 2 characters');
    });

    it('should return ValidationError when query is empty', async () => {
      const result = await useCase.execute({
        userId: senderId,
        query: '',
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr()).toBeInstanceOf(ValidationError);
    });

    it('should return ValidationError when query is only whitespace', async () => {
      const result = await useCase.execute({
        userId: senderId,
        query: '   ',
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr()).toBeInstanceOf(ValidationError);
    });

    it('should return ValidationError when query exceeds 200 characters', async () => {
      const result = await useCase.execute({
        userId: senderId,
        query: 'a'.repeat(201),
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr()).toBeInstanceOf(ValidationError);
      expect(result.unwrapErr().message).toContain('at most 200 characters');
    });
  });

  describe('search execution', () => {
    it('should find messages matching the search query', async () => {
      (mockMessageRepo.search as any).mockResolvedValue(
        ok({
          data: [msg1, msg2],
          total: 2,
          page: 1,
          pageSize: 20,
        } as PaginatedResult<Message>),
      );

      const result = await useCase.execute({
        userId: senderId,
        query: 'proyecto',
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const data = result.unwrap();
      expect(data.data).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.data[0].subject).toContain('Proyecto');
    });

    it('should return empty result when no messages match', async () => {
      (mockMessageRepo.search as any).mockResolvedValue(
        ok({
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
        }),
      );

      const result = await useCase.execute({
        userId: senderId,
        query: 'zzzznotfound',
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const data = result.unwrap();
      expect(data.data).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it('should only return messages the user has access to', async () => {
      const otherUserId = '00000000-0000-0000-0000-000000009999';

      (mockMessageRepo.search as any).mockResolvedValue(
        ok({
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
        }),
      );

      const result = await useCase.execute({
        userId: otherUserId,
        query: 'proyecto',
        page: 1,
        pageSize: 20,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const data = result.unwrap();
      expect(data.data).toHaveLength(0);
      expect(data.total).toBe(0);

      // Verify the search was called with the correct userId (UserId VO)
      expect(mockMessageRepo.search).toHaveBeenCalledWith(
        expect.objectContaining({ value: otherUserId }),
        TEST_EMPRESA_ID,
        'proyecto',
        expect.objectContaining({ page: 1, pageSize: 20 }),
      );
    });
  });

  describe('pagination', () => {
    it('should respect page and pageSize parameters', async () => {
      (mockMessageRepo.search as any).mockResolvedValue(
        ok({
          data: [msg1],
          total: 2,
          page: 2,
          pageSize: 1,
        }),
      );

      const result = await useCase.execute({
        userId: senderId,
        query: 'proyecto',
        page: 2,
        pageSize: 1,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const data = result.unwrap();
      expect(data.data).toHaveLength(1);
      expect(data.page).toBe(2);
      expect(data.pageSize).toBe(1);
      expect(data.total).toBe(2);
    });

    it('should default to page 1 and pageSize 20 when not provided', async () => {
      (mockMessageRepo.search as any).mockResolvedValue(
        ok({
          data: [msg1, msg2],
          total: 2,
          page: 1,
          pageSize: 20,
        }),
      );

      const result = await useCase.execute({
        userId: senderId,
        query: 'proyecto',
        page: 0,
        pageSize: 0,
      }, TEST_EMPRESA_ID);

      expect(result.isOk()).toBe(true);
      const data = result.unwrap();
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(20);
    });
  });
});
