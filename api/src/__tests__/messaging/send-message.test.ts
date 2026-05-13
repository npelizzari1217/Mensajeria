import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UserId,
  Email,
  RoleVO,
  Timestamp,
  User,
  MessageRepository,
  UserRepository,
  ok,
  err,
  NotFoundError,
  EventBus,
} from '@mensajeria/domain';
import { SendMessageUseCase } from '../../application/messaging/use-cases/send-message.use-case';

function makeUser(id: string, name: string = 'Test User') {
  return User.reconstruct({
    id: UserId.reconstruct(id),
    email: Email.reconstruct(`${name.toLowerCase().replace(/\s/g, '')}@example.com`),
    name,
    role: RoleVO.reconstruct('Usuario'),
    hashedPassword: '$2b$12$hashed',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockUserRepo: UserRepository;
  let mockMessageRepo: MessageRepository;
  let mockEventBus: EventBus;

  const senderId = '00000000-0000-0000-0000-000000000001';
  const recipientId = '00000000-0000-0000-0000-000000000002';
  const recipientId2 = '00000000-0000-0000-0000-000000000003';

  const validDTO = {
    senderId,
    recipientIds: [recipientId],
    subject: 'Test Subject',
    body: 'Test body content',
  };

  beforeEach(() => {
    const userStore = new Map<string, User>();
    userStore.set(senderId, makeUser(senderId, 'Sender'));
    userStore.set(recipientId, makeUser(recipientId, 'Recipient1'));
    userStore.set(recipientId2, makeUser(recipientId2, 'Recipient2'));

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
      save: vi.fn().mockResolvedValue(ok(undefined)),
      findById: vi.fn(),
      findByRecipient: vi.fn(),
      findBySender: vi.fn(),
      saveRecipient: vi.fn(),
      findThread: vi.fn(),
    } as any;

    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };

    useCase = new SendMessageUseCase(mockUserRepo, mockMessageRepo, mockEventBus);
  });

  it('should send a message to a single recipient successfully', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const msg = result.unwrap();
    expect(msg.subject).toBe('Test Subject');
    expect(msg.body).toBe('Test body content');
    expect(msg.senderId).toBe(senderId);
    expect(msg.recipients).toHaveLength(1);
    expect(msg.recipients[0].recipientId).toBe(recipientId);
    expect(msg.id).toBeDefined();
  });

  it('should send a message to multiple recipients', async () => {
    const result = await useCase.execute({
      ...validDTO,
      recipientIds: [recipientId, recipientId2],
    });

    expect(result.isOk()).toBe(true);
    const msg = result.unwrap();
    expect(msg.recipients).toHaveLength(2);
  });

  it('should return error for empty recipients', async () => {
    const result = await useCase.execute({
      ...validDTO,
      recipientIds: [],
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('at least one recipient');
  });

  it('should return error for non-existent sender', async () => {
    const result = await useCase.execute({
      ...validDTO,
      senderId: '00000000-0000-0000-0000-000000009999',
    });

    expect(result.isErr()).toBe(true);
  });

  it('should return error for non-existent recipient', async () => {
    const result = await useCase.execute({
      ...validDTO,
      recipientIds: ['00000000-0000-0000-0000-000000009999'],
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr()).toBeInstanceOf(NotFoundError);
  });

  it('should return error for invalid UUID format', async () => {
    const result = await useCase.execute({
      ...validDTO,
      senderId: 'not-a-uuid',
    });

    expect(result.isErr()).toBe(true);
  });

  it('should persist the message via repository', async () => {
    await useCase.execute(validDTO);

    expect(mockMessageRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should return error for empty subject', async () => {
    const result = await useCase.execute({
      ...validDTO,
      subject: '',
    });

    expect(result.isErr()).toBe(true);
    expect(result.unwrapErr().message).toContain('empty');
  });

  it('should publish MessageSent event after successful send', async () => {
    await useCase.execute(validDTO);

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (mockEventBus.publish as any).mock.calls[0][0];
    expect(publishedEvent.eventName).toBe('MessageSent');
    expect(publishedEvent.senderId.get()).toBe(senderId);
    expect(publishedEvent.recipientIds).toHaveLength(1);
  });

  it('should NOT publish event when send fails', async () => {
    const result = await useCase.execute({
      ...validDTO,
      senderId: 'not-a-uuid',
    });

    expect(result.isErr()).toBe(true);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
