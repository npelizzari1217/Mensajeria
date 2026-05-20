import {
  MessageId,
  UserId,
  EmpresaId,
  MessageRepository,
  MessageRead,
  UnauthorizedMessageAccessError,
  MessageNotFoundError,
  Result,
  ok,
  err,
  EventBus,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';

/**
 * MarkAsReadUseCase.
 *
 * Marks a message as read by a recipient. Idempotent — calling again
 * with status already 'Read' returns success without changing readAt.
 * Only the recipient can mark a message as read.
 */
export class MarkAsReadUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async execute(
    messageId: string,
    userId: string,
    empresaId: EmpresaId,
  ): Promise<Result<{
    status: string;
    readAt: string | null;
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

    // 2. Find message
    const msgResult = await this.messageRepo.findById(msgId, empresaId);
    if (msgResult.isErr()) {
      return err(new MessageNotFoundError(messageId));
    }
    const message = msgResult.unwrap();

    // 3. Check user is a recipient
    const recipient = message.getRecipient(uid);
    if (!recipient) {
      return err(new UnauthorizedMessageAccessError(userId, messageId));
    }

    // 4. Mark as read (idempotent)
    const markResult = recipient.markAsRead();
    if (markResult.isErr()) {
      return err(markResult.unwrapErr());
    }

    // 5. Persist
    const saveResult = await this.messageRepo.saveRecipient(recipient);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 6. Emit event
    const event = new MessageRead(
      message.getId(),
      uid,
      recipient.getReadAt()!,
    );
    this.eventBus.publish(event);

    return ok({
      status: recipient.getStatus().toString(),
      readAt: recipient.getReadAt()?.toString() ?? null,
    });
  }
}
