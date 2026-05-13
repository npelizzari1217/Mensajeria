import {
  MessageId,
  UserId,
  UserRepository,
  MessageRepository,
  UnauthorizedMessageAccessError,
  Result,
  ok,
  err,
  MessageNotFoundError,
} from '@mensajeria/domain';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * GetMessageUseCase.
 *
 * Returns full message detail only if the requesting user is either
 * the sender or a recipient. Returns 403 (UnauthorizedMessageAccessError)
 * for anyone else.
 */
export class GetMessageUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly messageRepo: MessageRepository,
  ) {}

  async execute(
    messageId: string,
    userId: string,
  ): Promise<Result<MessageResponse, Error>> {
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

    // 2. Find message
    const msgResult = await this.messageRepo.findById(msgId);
    if (msgResult.isErr()) {
      return err(new MessageNotFoundError(messageId));
    }
    const message = msgResult.unwrap();

    // 3. Check access
    if (!message.isAccessibleBy(uid)) {
      return err(new UnauthorizedMessageAccessError(userId, messageId));
    }

    // 4. Load sender info
    const senderResult = await this.userRepo.findById(message.getSenderId());
    const senderName = senderResult.isOk()
      ? senderResult.unwrap().getName()
      : 'Unknown';

    // 5. Load recipient names
    const recipientPromises = message.getRecipients().map(async (r) => {
      const userResult = await this.userRepo.findById(r.getRecipientId());
      const name = userResult.isOk() ? userResult.unwrap().getName() : 'Unknown';
      return {
        recipientId: r.getRecipientId().get(),
        recipientName: name,
        status: r.getStatus().toString(),
        readAt: r.getReadAt()?.toString() ?? null,
      };
    });
    const recipients = await Promise.all(recipientPromises);

    return ok({
      id: message.getId().get(),
      senderId: message.getSenderId().get(),
      senderName,
      subject: message.getSubject().get(),
      body: message.getBody().get(),
      parentMessageId: message.getParentMessageId()?.get() ?? null,
      sentAt: message.getCreatedAt().toString(),
      createdAt: message.getCreatedAt().toString(),
      recipients,
    });
  }
}
