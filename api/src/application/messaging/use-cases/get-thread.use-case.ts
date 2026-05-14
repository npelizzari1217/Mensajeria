import {
  MessageId,
  UserId,
  MessageRepository,
  UnauthorizedMessageAccessError,
  MessageNotFoundError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * GetThreadUseCase.
 *
 * Returns all messages in a thread (chain by parentMessageId).
 * Access is granted if the user is sender or recipient of ANY message in the thread.
 *
 * Sender and recipient names are populated by the repository mapper
 * via Prisma joins — no additional queries needed.
 */
export class GetThreadUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
  ) {}

  async execute(
    messageId: string,
    userId: string,
  ): Promise<Result<{
    messages: MessageResponse[];
  }, Error>> {
    // 1. Validate IDs
    const msgIdResult = MessageId.create(messageId);
    if (msgIdResult.isErr()) {
      return err(msgIdResult.unwrapErr());
    }
    const msgId = msgIdResult.unwrap();

    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) {
      return err(uidResult.unwrapErr());
    }
    const uid = uidResult.unwrap();

    // 2. Find root message
    const rootResult = await this.messageRepo.findById(msgId);
    if (rootResult.isErr()) {
      return err(new MessageNotFoundError(messageId));
    }
    const rootMessage = rootResult.unwrap();

    // 3. Check access to root
    if (!rootMessage.isAccessibleBy(uid)) {
      return err(new UnauthorizedMessageAccessError(userId, messageId));
    }

    // 4. Get full thread from repository
    const threadResult = await this.messageRepo.findThread(msgId);
    if (threadResult.isErr()) {
      return err(threadResult.unwrapErr());
    }
    const threadMessages = threadResult.unwrap();

    // 5. Map to responses (names pre-populated by mapper from Prisma joins)
    const messages: MessageResponse[] = threadMessages.map((msg) => ({
      id: msg.getId().get(),
      senderId: msg.getSenderId().get(),
      senderName: msg.getSenderName() ?? 'Unknown',
      subject: msg.getSubject().get(),
      body: msg.getBody().get(),
      parentMessageId: msg.getParentMessageId()?.get() ?? null,
      sentAt: msg.getCreatedAt().toString(),
      createdAt: msg.getCreatedAt().toString(),
      recipients: msg.getRecipients().map((r) => ({
        recipientId: r.getRecipientId().get(),
        recipientName: r.getRecipientName() ?? '',
        status: r.getStatus().toString(),
        readAt: r.getReadAt()?.toString() ?? null,
      })),
    }));

    return ok({ messages });
  }
}
