import {
  Message,
  MessageId,
  UserId,
  Subject,
  MessageBody,
  UserRepository,
  MessageRepository,
  MessageSent,
  UnauthorizedMessageAccessError,
  MessageNotFoundError,
  Result,
  ok,
  err,
  EventBus,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { ReplyMessageDTO } from '../dtos/reply-message.dto';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * ReplyToMessageUseCase.
 *
 * Creates a new message as a reply to an existing one.
 * Sets parentMessageId on the new message to preserve thread context.
 * The user must have access to the parent message (sender or recipient).
 */
export class ReplyToMessageUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly messageRepo: MessageRepository,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async execute(dto: ReplyMessageDTO): Promise<Result<MessageResponse, Error>> {
    // 1. Validate senderId
    const senderIdResult = UserId.create(dto.senderId);
    if (senderIdResult.isErr()) {
      return err(senderIdResult.unwrapErr());
    }
    const senderId = senderIdResult.unwrap();

    // 2. Verify sender exists
    const senderResult = await this.userRepo.findById(senderId);
    if (senderResult.isErr()) {
      return err(senderResult.unwrapErr());
    }
    const sender = senderResult.unwrap();

    // 3. Validate and find parent message
    const parentIdResult = MessageId.create(dto.parentMessageId);
    if (parentIdResult.isErr()) {
      return err(parentIdResult.unwrapErr());
    }
    const parentMsgResult = await this.messageRepo.findById(parentIdResult.unwrap());
    if (parentMsgResult.isErr()) {
      return err(new MessageNotFoundError(dto.parentMessageId));
    }
    const parentMessage = parentMsgResult.unwrap();
    const parentMsgId = parentMessage.getId();

    // 4. Check user has access to parent
    if (!parentMessage.isAccessibleBy(senderId)) {
      return err(new UnauthorizedMessageAccessError(dto.senderId, dto.parentMessageId));
    }

    // 5. Inherit subject from parent (prefixed with "Re: ")
    const subjectResult = Subject.create(`Re: ${parentMessage.getSubject().get()}`);
    if (subjectResult.isErr()) {
      return err(subjectResult.unwrapErr());
    }
    const subject = subjectResult.unwrap();

    // 6. Validate body
    const bodyResult = MessageBody.create(dto.body ?? '');
    if (bodyResult.isErr()) {
      return err(bodyResult.unwrapErr());
    }
    const body = bodyResult.unwrap();

    // 7. Gather all unique recipients from parent (excluding sender) plus original sender
    const parentRecipients = parentMessage.getRecipients().map((r) => r.getRecipientId());
    const parentSenderId = parentMessage.getSenderId();

    const allRecipientIds: UserId[] = [];
    const seen = new Set<string>();

    // Add parent recipients (excluding current sender)
    for (const r of parentRecipients) {
      const key = r.get();
      if (!seen.has(key) && !r.equals(senderId)) {
        seen.add(key);
        allRecipientIds.push(r);
      }
    }

    // Add parent sender (if they're not the current sender)
    const parentSenderKey = parentSenderId.get();
    if (!seen.has(parentSenderKey) && !parentSenderId.equals(senderId)) {
      seen.add(parentSenderKey);
      allRecipientIds.push(parentSenderId);
    }

    // If no recipients after dedup, reply fails
    if (allRecipientIds.length === 0) {
      return err(new Error('No recipients to reply to'));
    }

    // 8. Create reply message
    const messageResult = Message.create(
      senderId,
      subject,
      body,
      allRecipientIds,
      MessageId.reconstruct(dto.parentMessageId),
    );
    if (messageResult.isErr()) {
      return err(messageResult.unwrapErr());
    }
    const message = messageResult.unwrap();

    // 9. Persist
    const saveResult = await this.messageRepo.save(message);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 10. Emit event
    const event = new MessageSent(
      message.getId(),
      message.getSenderId(),
      message.getRecipients().map((r) => r.getRecipientId()),
    );
    this.eventBus.publish(event);

    // 11. Build response
    return ok({
      id: message.getId().get(),
      senderId: message.getSenderId().get(),
      senderName: sender.getName(),
      subject: message.getSubject().get(),
      body: message.getBody().get(),
      parentMessageId: message.getParentMessageId()?.get() ?? null,
      sentAt: message.getCreatedAt().toString(),
      createdAt: message.getCreatedAt().toString(),
      recipients: message.getRecipients().map((r) => ({
        recipientId: r.getRecipientId().get(),
        recipientName: r.getRecipientName() ?? '',
        status: r.getStatus().toString(),
        readAt: r.getReadAt()?.toString() ?? null,
      })),
    });
  }
}
