import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserId,
  Email,
  RoleVO,
  Timestamp,
  User,
  Message,
  MessageId,
  Subject,
  MessageBody,
  MessageRecipient,
  MessageRepository,
  MessageStatusVO,
  MessageStatus,
  ok,
  err,
  UnauthorizedMessageAccessError,
  NotFoundError,
  EventBus,
} from '@mensajeria/domain';
import { MarkAsReadUseCase } from '../../application/messaging/use-cases/mark-as-read.use-case';

function makeUser(id: string) {
  return User.reconstruct({
    id: UserId.reconstruct(id),
    email: Email.reconstruct(`user${id}@example.com`),
    name: `User ${id}`,
    role: RoleVO.reconstruct('Usuario'),
    hashedPassword: '$2b$12$hashed',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

function makeMessageWithRecipient(
  msgId: string,
  senderId: string,
  recipientId: string,
  recipientStatus: MessageStatus = MessageStatus.Delivered,
): Message {
  const recipient = MessageRecipient.reconstruct({
    messageId: MessageId.reconstruct(msgId),
    recipientId: UserId.reconstruct(recipientId),
    status: MessageStatusVO.reconstruct(recipientStatus),
    receivedAt: recipientStatus !== MessageStatus.Pending ? Timestamp.now() : null,
    readAt: recipientStatus === MessageStatus.Read ? Timestamp.now() : null,
    createdAt: Timestamp.now(),
  });

  return Message.reconstruct({
    id: MessageId.reconstruct(msgId),
    senderId: UserId.reconstruct(senderId),
    subject: Subject.reconstruct('Test Subject'),
    body: MessageBody.reconstruct('Test body'),
    parentMessageId: null,
    createdAt: Timestamp.now(),
    recipients: [recipient],
  });
}

describe('MarkAsReadUseCase', () => {
  let useCase: MarkAsReadUseCase;
  let mockMessageRepo: MessageRepository;
  let mockEventBus: EventBus;

  const messageId = '00000000-0000-0000-0000-000000000001';
  const senderId = '00000000-0000-0000-0000-000000000002';
  const recipientId = '00000000-0000-0000-0000-000000000003';
  const strangerId = '00000000-0000-0000-0000-000000000004';

  beforeEach(() => {
    mockMessageRepo = {
      findById: vi.fn(),
      findByRecipient: vi.fn(),
      findBySender: vi.fn(),
      save: vi.fn(),
      saveRecipient: vi.fn().mockResolvedValue(ok(undefined)),
      findThread: vi.fn(),
    } as any;

    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };

    useCase = new MarkAsReadUseCase(mockMessageRepo, mockEventBus);
  });

  it('should mark a delivered message as read', async () => {
    const message = makeMessageWithRecipient(messageId, senderId, recipientId, MessageStatus.Delivered);
    (mockMessageRepo.findById as any).mockResolvedValue(ok(message));

    const result = await useCase.execute(messageId, recipientId);

    expect(result.isOk()).toBe(true);
    const markResult = result.unwrap();
    expect(markResult.status).toBe('Read');
    expect(markResult.readAt).toBeDefined();
  });

  it('should be idempotent when already read', async () => {
    const message = makeMessageWithRecipient(messageId, senderId, recipientId, MessageStatus.Read);
    const originalReadAt = message.getRecipients()[0].getReadAt()?.toString();
    (mockMessageRepo.findById as any).mockResolvedValue(ok(message));

    const result = await useCase.execute(messageId, recipientId);

    expect(result.isOk()).toBe(true);
    const markResult = result.unwrap();
    expect(markResult.status).toBe('Read');
    // readAt should remain the same (idempotent)
    expect(markResult.readAt).toBe(originalReadAt);
  });

  it('should return error when user is not a recipient', async () => {
    const message = makeMessageWithRecipient(messageId, senderId, recipientId, MessageStatus.Delivered);
    (mockMessageRepo.findById as any).mockResolvedValue(ok(message));

    const result = await useCase.execute(messageId, strangerId);

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(UnauthorizedMessageAccessError);
  });

  it('should return error when message does not exist', async () => {
    (mockMessageRepo.findById as any).mockResolvedValue(
      err(new NotFoundError('Message', messageId)),
    );

    const result = await useCase.execute(messageId, recipientId);

    expect(result.isErr()).toBe(true);
  });

  it('should persist the updated recipient', async () => {
    const message = makeMessageWithRecipient(messageId, senderId, recipientId, MessageStatus.Delivered);
    (mockMessageRepo.findById as any).mockResolvedValue(ok(message));

    await useCase.execute(messageId, recipientId);

    expect(mockMessageRepo.saveRecipient).toHaveBeenCalledTimes(1);
  });

  it('should publish MessageRead event after successful mark-as-read', async () => {
    const message = makeMessageWithRecipient(messageId, senderId, recipientId, MessageStatus.Delivered);
    (mockMessageRepo.findById as any).mockResolvedValue(ok(message));

    await useCase.execute(messageId, recipientId);

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (mockEventBus.publish as any).mock.calls[0][0];
    expect(publishedEvent.eventName).toBe('MessageRead');
    expect(publishedEvent.recipientId.get()).toBe(recipientId);
  });

  it('should NOT publish event when mark-as-read fails', async () => {
    const message = makeMessageWithRecipient(messageId, senderId, recipientId, MessageStatus.Delivered);
    (mockMessageRepo.findById as any).mockResolvedValue(ok(message));

    await useCase.execute(messageId, strangerId);

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
