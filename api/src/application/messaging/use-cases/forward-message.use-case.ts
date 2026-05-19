import {
  UserId, UserRepository,
  Message, MessageId, MessageRepository,
  Subject, MessageBody,
  MessageSent, ForwardedContent,
  UnauthorizedMessageAccessError,
  MessageNotFoundError, NotFoundError,
  Result, ok, err,
  EventBus,
  Email,
  User,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { ForwardMessageDTO } from '../dtos/forward-message.dto';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * ForwardMessageUseCase.
 *
 * Creates a new message that forwards an existing message to new recipients.
 * The original message content is quoted in the body.
 * The user must have access to the original message (sender or recipient).
 */
export class ForwardMessageUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly messageRepo: MessageRepository,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async execute(dto: ForwardMessageDTO): Promise<Result<MessageResponse, Error>> {
    // 1. Validate sender
    const senderIdResult = UserId.create(dto.senderId);
    if (senderIdResult.isErr()) return err(senderIdResult.unwrapErr());
    const senderId = senderIdResult.unwrap();

    const senderResult = await this.userRepo.findById(senderId);
    if (senderResult.isErr()) return err(new NotFoundError('Sender', dto.senderId));
    const sender = senderResult.unwrap();

    // 2. Find original message
    const originalIdResult = MessageId.create(dto.originalMessageId);
    if (originalIdResult.isErr()) return err(originalIdResult.unwrapErr());

    const originalResult = await this.messageRepo.findById(originalIdResult.unwrap());
    if (originalResult.isErr()) return err(new MessageNotFoundError(dto.originalMessageId));
    const originalMessage = originalResult.unwrap();

    // 3. Check user has access to original message
    if (!originalMessage.isAccessibleBy(senderId)) {
      return err(new UnauthorizedMessageAccessError(dto.senderId, dto.originalMessageId));
    }

    // 4. Validate recipientEmails and resolve to UserIds
    if (!dto.recipientEmails || dto.recipientEmails.length === 0) {
      return err(new Error('Forward message must have at least one recipient'));
    }

    const recipients: User[] = [];
    for (const rawEmail of dto.recipientEmails) {
      const emailResult = Email.create(rawEmail);
      if (emailResult.isErr()) return err(emailResult.unwrapErr());

      const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
      if (userResult.isErr()) return err(new NotFoundError('Recipient', rawEmail));
      recipients.push(userResult.unwrap());
    }

    const recipientIds = recipients.map((u) => u.getId());

    // 5. Build forwarded content
    const forwardedContent = ForwardedContent.create({
      originalMessageId: dto.originalMessageId,
      originalSenderName: originalMessage.getSenderName() ?? 'Unknown',
      originalSubject: originalMessage.getSubject().get(),
      originalBody: originalMessage.getBody().get(),
      comment: dto.comment,
    });

    // 6. Create subject (prefixed with "Fwd: ")
    const subjectResult = Subject.create(`Fwd: ${originalMessage.getSubject().get()}`);
    if (subjectResult.isErr()) return err(subjectResult.unwrapErr());

    // 7. Create body from forwarded content
    const bodyResult = MessageBody.create(forwardedContent.buildForwardBody());
    if (bodyResult.isErr()) return err(bodyResult.unwrapErr());

    // 8. Create new message
    const messageResult = Message.create(
      senderId,
      subjectResult.unwrap(),
      bodyResult.unwrap(),
      recipientIds,
    );
    if (messageResult.isErr()) return err(messageResult.unwrapErr());
    const message = messageResult.unwrap();

    // 9. Persist
    const saveResult = await this.messageRepo.save(message);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

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
