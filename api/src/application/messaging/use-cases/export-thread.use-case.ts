import {
  MessageId, UserId, EmpresaId,
  MessageRepository,
  UnauthorizedMessageAccessError,
  MessageNotFoundError,
  Result, ok, err,
} from '@mensajeria/domain';

/**
 * ExportThreadUseCase.
 *
 * Verifies access to the thread, retrieves all messages,
 * and returns them as a serializable JSON export.
 */
export class ExportThreadUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
  ) {}

  async execute(
    messageId: string,
    userId: string,
    empresaId: EmpresaId,
    _format: string = 'json',
  ): Promise<Result<ThreadExport, Error>> {
    // 1. Validate IDs
    const msgIdResult = MessageId.create(messageId);
    if (msgIdResult.isErr()) return err(msgIdResult.unwrapErr());
    const msgId = msgIdResult.unwrap();

    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    // 2. Find root message
    const rootResult = await this.messageRepo.findById(msgId, empresaId);
    if (rootResult.isErr()) return err(new MessageNotFoundError(messageId));
    const rootMessage = rootResult.unwrap();

    // 3. Check access
    if (!rootMessage.isAccessibleBy(uid)) {
      return err(new UnauthorizedMessageAccessError(userId, messageId));
    }

    // 4. Get full thread
    const threadResult = await this.messageRepo.findThread(msgId);
    if (threadResult.isErr()) return err(threadResult.unwrapErr());
    const threadMessages = threadResult.unwrap();

    // 5. Build export
    const messages: ExportedMessage[] = threadMessages.map((msg) => ({
      id: msg.getId().get(),
      senderId: msg.getSenderId().get(),
      senderName: msg.getSenderName() ?? 'Unknown',
      subject: msg.getSubject().get(),
      body: msg.getBody().get(),
      parentMessageId: msg.getParentMessageId()?.get() ?? null,
      sentAt: msg.getCreatedAt().toString(),
      recipients: msg.getRecipients().map((r) => ({
        recipientId: r.getRecipientId().get(),
        recipientName: r.getRecipientName() ?? '',
        status: r.getStatus().toString(),
        readAt: r.getReadAt()?.toString() ?? null,
      })),
    }));

    return ok({
      exportedAt: new Date().toISOString(),
      threadId: messageId,
      totalMessages: messages.length,
      messages,
    });
  }
}

export interface ExportedMessage {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  parentMessageId: string | null;
  sentAt: string;
  recipients: {
    recipientId: string;
    recipientName: string;
    status: string;
    readAt: string | null;
  }[];
}

export interface ThreadExport {
  exportedAt: string;
  threadId: string;
  totalMessages: number;
  messages: ExportedMessage[];
}
