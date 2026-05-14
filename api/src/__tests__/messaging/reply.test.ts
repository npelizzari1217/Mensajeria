import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserId,
  User,
  Email,
  RoleVO,
  Timestamp,
  Message,
  MessageId,
  Subject,
  MessageBody,
  MessageRecipient,
  MessageRepository,
  UserRepository,
  MessageStatus,
  MessageStatusVO,
  ok,
  err,
  NotFoundError,
  UnauthorizedMessageAccessError,
  EventBus,
} from '@mensajeria/domain';
import { ReplyToMessageUseCase } from '../../application/messaging/use-cases/reply-to-message.use-case';
import { GetThreadUseCase } from '../../application/messaging/use-cases/get-thread.use-case';

function makeUser(id: string, name: string) {
  return User.reconstruct({
    id: UserId.reconstruct(id),
    email: Email.reconstruct(`${name.toLowerCase()}@example.com`),
    name,
    role: RoleVO.reconstruct('Usuario'),
    hashedPassword: '$2b$12$hashed',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

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
    parentMessageId: parentMessageId ? MessageId.reconstruct(parentMessageId) : null,
    createdAt: Timestamp.now(),
    recipients,
  });
}


describe('ReplyToMessageUseCase', () => {
  let replyUseCase: ReplyToMessageUseCase;
  let threadUseCase: GetThreadUseCase;
  let mockUserRepo: UserRepository;
  let mockMessageRepo: MessageRepository;
  let mockEventBus: EventBus;

  const senderId = '00000000-0000-0000-0000-000000000001';
  const recipientId = '00000000-0000-0000-0000-000000000002';
  const originalMsgId = '00000000-0000-0000-0000-000000000010';

  beforeEach(() => {
    const userStore = new Map<string, User>();
    userStore.set(senderId, makeUser(senderId, 'Sender'));
    userStore.set(recipientId, makeUser(recipientId, 'Recipient'));

    const originalMessage = makeMessage(originalMsgId, senderId, 'Original Subject', 'Original body', [recipientId]);

    mockUserRepo = {
      findById: vi.fn(async (id: UserId) => {
        const user = userStore.get(id.get());
        if (!user) return err(new NotFoundError('User', id.get()));
        return ok(user);
      }),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
    } as any;

    mockMessageRepo = {
      findById: vi.fn().mockResolvedValue(ok(originalMessage)),
      save: vi.fn().mockResolvedValue(ok(undefined)),
      findByRecipient: vi.fn(),
      findBySender: vi.fn(),
      saveRecipient: vi.fn(),
      findThread: vi.fn(),
    } as any;

    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };

    replyUseCase = new ReplyToMessageUseCase(mockUserRepo, mockMessageRepo, mockEventBus);
    threadUseCase = new GetThreadUseCase(mockUserRepo, mockMessageRepo);
  });

  describe('ReplyToMessageUseCase', () => {
    it('should create a reply with parentMessageId', async () => {
      const result = await replyUseCase.execute({
        senderId: recipientId, // recipient replies to sender
        parentMessageId: originalMsgId,
        body: 'This is a reply',
      });

      expect(result.isOk()).toBe(true);
      const reply = result.unwrap();
      expect(reply.parentMessageId).toBe(originalMsgId);
      expect(reply.body).toBe('This is a reply');
      expect(reply.subject).toContain('Re:');
    });

    it('should reply successfully when sender responds to their own message', async () => {
      const result = await replyUseCase.execute({
        senderId, // original sender replies
        parentMessageId: originalMsgId,
        body: 'Additional info',
      });

      expect(result.isOk()).toBe(true);
      const reply = result.unwrap();
      expect(reply.parentMessageId).toBe(originalMsgId);
    });

    it('should return error when parent message does not exist', async () => {
      (mockMessageRepo.findById as any).mockResolvedValue(
        err(new NotFoundError('Message', 'nonexistent')),
      );

      const result = await replyUseCase.execute({
        senderId: recipientId,
        parentMessageId: '00000000-0000-0000-0000-000000009999',
        body: 'Reply',
      });

      expect(result.isErr()).toBe(true);
    });

    it('should return error when user has no access to parent', async () => {
      const strangerMsg = makeMessage('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000009999', 'Private', 'secret', ['00000000-0000-0000-0000-000000009998']);
      (mockMessageRepo.findById as any).mockResolvedValue(ok(strangerMsg));

      const result = await replyUseCase.execute({
        senderId: recipientId,
        parentMessageId: '00000000-0000-0000-0000-000000000020',
        body: 'Reply',
      });

      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr()).toBeInstanceOf(UnauthorizedMessageAccessError);
    });
  });

  describe('GetThreadUseCase', () => {
    it('should return thread messages ordered by sentAt', async () => {
      const msgA = makeMessage('00000000-0000-0000-0000-000000000030', senderId, 'Thread Root', 'Root', [recipientId]);
      const msgB = makeMessage('00000000-0000-0000-0000-000000000031', recipientId, 'Re: Thread Root', 'Reply 1', [senderId], '00000000-0000-0000-0000-000000000030');
      const msgC = makeMessage('00000000-0000-0000-0000-000000000032', senderId, 'Re: Thread Root', 'Reply 2', [recipientId], '00000000-0000-0000-0000-000000000031');

      (mockMessageRepo.findById as any).mockResolvedValue(ok(msgA));
      (mockMessageRepo.findThread as any).mockResolvedValue(ok([msgA, msgB, msgC]));

      const result = await threadUseCase.execute('00000000-0000-0000-0000-000000000030', senderId);

      expect(result.isOk()).toBe(true);
      const thread = result.unwrap();
      expect(thread.messages).toHaveLength(3);
      // Should be ordered by sentAt ASC
      expect(thread.messages[0].id).toBe('00000000-0000-0000-0000-000000000030');
      expect(thread.messages[1].id).toBe('00000000-0000-0000-0000-000000000031');
      expect(thread.messages[2].id).toBe('00000000-0000-0000-0000-000000000032');
    });

    it('should return error for unauthorized thread access', async () => {
      const strangerId = '00000000-0000-0000-0000-000000009999';
      const privateMsg = makeMessage('00000000-0000-0000-0000-000000000040', strangerId, 'Secret', 'hush', ['00000000-0000-0000-0000-000000009998']);

      (mockMessageRepo.findById as any).mockResolvedValue(ok(privateMsg));

      const result = await threadUseCase.execute('00000000-0000-0000-0000-000000000040', recipientId);

      expect(result.isErr()).toBe(true);
    });
  });
});
