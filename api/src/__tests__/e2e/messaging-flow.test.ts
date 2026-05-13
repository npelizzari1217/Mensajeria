import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  User,
  UserId,
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
  EventBus,
} from '@mensajeria/domain';
import { SendMessageUseCase } from '../../application/messaging/use-cases/send-message.use-case';
import { GetInboxUseCase } from '../../application/messaging/use-cases/get-inbox.use-case';
import { GetSentUseCase } from '../../application/messaging/use-cases/get-sent.use-case';
import { GetMessageUseCase } from '../../application/messaging/use-cases/get-message.use-case';
import { MarkAsReadUseCase } from '../../application/messaging/use-cases/mark-as-read.use-case';
import { ReplyToMessageUseCase } from '../../application/messaging/use-cases/reply-to-message.use-case';

function makeUser(id: string, name: string) {
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

/**
 * Integration-style E2E test: login → send → receive inbox → mark read → reply
 *
 * Mocks infrastructure adapters but wires all use cases together
 * to verify the complete messaging flow.
 */
describe('Messaging E2E Flow (Send → Receive → Read → Reply)', () => {
  const senderId = '00000000-0000-0000-0000-000000000001';
  const recipientId = '00000000-0000-0000-0000-000000000002';
  const strangerId = '00000000-0000-0000-0000-000000000003';

  let userRepo: UserRepository;
  let messageRepo: MessageRepository & { _store: Map<string, Message[]> };
  let mockEventBus: EventBus;
  let sendMessageUseCase: SendMessageUseCase;
  let getInboxUseCase: GetInboxUseCase;
  let getSentUseCase: GetSentUseCase;
  let getMessageUseCase: GetMessageUseCase;
  let markAsReadUseCase: MarkAsReadUseCase;
  let replyToMessageUseCase: ReplyToMessageUseCase;

  beforeEach(() => {
    // ── In-memory stores ─────────────────────────────────────────────
    const userStore = new Map<string, User>();
    userStore.set(senderId, makeUser(senderId, 'Alice'));
    userStore.set(recipientId, makeUser(recipientId, 'Bob'));
    userStore.set(strangerId, makeUser(strangerId, 'Charlie'));

    // messageStore: senderId → Message[]
    const messageStore = new Map<string, Message[]>();
    const recipientStore = new Map<string, MessageRecipient[]>();

    // ── User Repository ──────────────────────────────────────────────
    userRepo = {
      findById: vi.fn(async (id: UserId) => {
        const user = userStore.get(id.get());
        if (!user) return err(new NotFoundError('User', id.get()));
        return ok(user);
      }),
      findByEmail: vi.fn(),
      save: vi.fn(),
      existsByEmail: vi.fn(),
    } as any;

    // ── Message Repository ───────────────────────────────────────────
    messageRepo = {
      _store: messageStore,

      save: vi.fn(async (message: Message) => {
        const sid = message.getSenderId().get();
        const existing = messageStore.get(sid) ?? [];
        existing.push(message);
        messageStore.set(sid, existing);

        // Also index by recipient
        for (const r of message.getRecipients()) {
          const rid = r.getRecipientId().get();
          const rMessages = recipientStore.get(rid) ?? [];
          rMessages.push(message);
          recipientStore.set(rid, rMessages);
        }

        return ok(undefined);
      }),

      findById: vi.fn(async (id: MessageId) => {
        // Search all stores
        for (const [, messages] of messageStore) {
          const found = messages.find((m) => m.getId().equals(id));
          if (found) return ok(found);
        }
        for (const [, messages] of recipientStore) {
          const found = messages.find((m) => m.getId().equals(id));
          if (found) return ok(found);
        }
        return err(new NotFoundError('Message', id.get()));
      }),

      findByRecipient: vi.fn(async (userId: UserId) => {
        const messages = recipientStore.get(userId.get()) ?? [];
        return ok({
          data: messages,
          total: messages.length,
          page: 1,
          pageSize: messages.length,
        });
      }),

      findBySender: vi.fn(async (userId: UserId) => {
        const messages = messageStore.get(userId.get()) ?? [];
        return ok({
          data: messages,
          total: messages.length,
          page: 1,
          pageSize: messages.length,
        });
      }),

      saveRecipient: vi.fn(async (recipient: MessageRecipient) => {
        return ok(undefined);
      }),

      findThread: vi.fn(async (messageId: MessageId) => {
        // Simple thread: collect all messages via parentMessageId chain
        const allMessages: Message[] = [];

        // Find the root message
        for (const [, messages] of messageStore) {
          for (const m of messages) {
            if (m.getId().equals(messageId)) {
              allMessages.push(m);
              break;
            }
          }
        }
        for (const [, messages] of recipientStore) {
          for (const m of messages) {
            if (m.getId().equals(messageId) && !allMessages.some((am) => am.getId().equals(m.getId()))) {
              allMessages.push(m);
              break;
            }
          }
        }

        // Collect linked messages
        const linked: Message[] = [];
        for (const [, messages] of messageStore) {
          for (const m of messages) {
            const pmId = m.getParentMessageId();
            if (pmId) {
              for (const am of allMessages) {
                if (am.getId().equals(pmId) && !allMessages.some((x) => x.getId().equals(m.getId()))) {
                  linked.push(m);
                  break;
                }
              }
            }
          }
        }

        const result = [...allMessages, ...linked];
        result.sort(
          (a, b) => a.getCreatedAt().get().getTime() - b.getCreatedAt().get().getTime(),
        );
        return ok(result);
      }),
    } as any;

    // ── Event Bus ────────────────────────────────────────────────────
    mockEventBus = {
      publish: vi.fn(),
      subscribe: vi.fn(),
    };

    // ── Wire Use Cases ───────────────────────────────────────────────
    sendMessageUseCase = new SendMessageUseCase(userRepo, messageRepo, mockEventBus);
    getInboxUseCase = new GetInboxUseCase(messageRepo);
    getSentUseCase = new GetSentUseCase(messageRepo);
    getMessageUseCase = new GetMessageUseCase(userRepo, messageRepo);
    markAsReadUseCase = new MarkAsReadUseCase(messageRepo, mockEventBus);
    replyToMessageUseCase = new ReplyToMessageUseCase(userRepo, messageRepo);
  });

  it('full messaging flow: send → receive inbox → view detail → mark read → reply', async () => {
    // ── 1. Alice sends a message to Bob ──────────────────────────────
    const sendResult = await sendMessageUseCase.execute({
      senderId,
      recipientIds: [recipientId],
      subject: 'Project Update',
      body: 'The project is on track for Q1 delivery.',
    });
    expect(sendResult.isOk()).toBe(true);
    const sentMessage = sendResult.unwrap();
    expect(sentMessage.subject).toBe('Project Update');
    expect(sentMessage.recipients).toHaveLength(1);
    const messageId = sentMessage.id;

    // ── 2. Alice checks sent messages ─────────────────────────────────
    const sentResult = await getSentUseCase.execute({
      userId: senderId,
      page: 1,
      pageSize: 20,
    });
    expect(sentResult.isOk()).toBe(true);
    expect(sentResult.unwrap().data.length).toBeGreaterThanOrEqual(1);

    // ── 3. Bob checks inbox (should see Alice's message) ──────────────
    const inboxResult = await getInboxUseCase.execute({
      userId: recipientId,
      page: 1,
      pageSize: 20,
    });
    expect(inboxResult.isOk()).toBe(true);
    const inbox = inboxResult.unwrap();
    expect(inbox.data.length).toBeGreaterThanOrEqual(1);
    const bobInbox = inbox.data.find((m) => m.id === messageId);
    expect(bobInbox).toBeDefined();
    expect(bobInbox!.senderId).toBe(senderId);

    // ── 4. Bob views message detail ───────────────────────────────────
    const detailResult = await getMessageUseCase.execute(messageId, recipientId);
    expect(detailResult.isOk()).toBe(true);
    const detail = detailResult.unwrap();
    expect(detail.id).toBe(messageId);
    expect(detail.senderName).toBe('Alice');
    expect(detail.body).toBe('The project is on track for Q1 delivery.');

    // ── 5. Bob marks message as read ──────────────────────────────────
    const markResult = await markAsReadUseCase.execute(messageId, recipientId);
    expect(markResult.isOk()).toBe(true);
    const markData = markResult.unwrap();
    expect(markData.status).toBe('Read');
    expect(markData.readAt).toBeDefined();

    // ── 6. Mark as read is idempotent ─────────────────────────────────
    const markAgainResult = await markAsReadUseCase.execute(messageId, recipientId);
    expect(markAgainResult.isOk()).toBe(true);

    // ── 7. Bob replies to Alice's message ─────────────────────────────
    const replyResult = await replyToMessageUseCase.execute({
      senderId: recipientId,
      parentMessageId: messageId,
      body: 'Thanks for the update, Alice!',
    });
    expect(replyResult.isOk()).toBe(true);
    const reply = replyResult.unwrap();
    expect(reply.parentMessageId).toBe(messageId);
    expect(reply.subject).toContain('Re:');

    // ── 8. Stranger cannot access Alice's message ─────────────────────
    const forbiddenResult = await getMessageUseCase.execute(messageId, strangerId);
    expect(forbiddenResult.isErr()).toBe(true);
  });
});
