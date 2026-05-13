import {
  Message,
  MessageId,
  UserId,
  Subject,
  MessageBody,
  UserRepository,
  MessageRepository,
  MessageSent,
  NotFoundError,
  Result,
  ok,
  err,
  EventBus,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { SendMessageDTO } from '../dtos/send-message.dto';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * SendMessageUseCase.
 *
 * Creates a new message with one or more recipients, persists it,
 * emits a MessageSent domain event, and returns the created message.
 */
export class SendMessageUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly messageRepo: MessageRepository,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async execute(dto: SendMessageDTO): Promise<Result<MessageResponse, Error>> {
    // 1. Validate senderId
    const senderIdResult = UserId.create(dto.senderId);
    if (senderIdResult.isErr()) {
      return err(senderIdResult.unwrapErr());
    }
    const senderId = senderIdResult.unwrap();

    // 2. Verify sender exists
    const senderResult = await this.userRepo.findById(senderId);
    if (senderResult.isErr()) {
      return err(new NotFoundError('Sender', dto.senderId));
    }
    const sender = senderResult.unwrap();

    // 3. Validate recipientIds and check all recipients exist
    if (!dto.recipientIds || dto.recipientIds.length === 0) {
      return err(new Error('Message must have at least one recipient'));
    }

    const recipientIds: UserId[] = [];
    for (const rawId of dto.recipientIds) {
      const idResult = UserId.create(rawId);
      if (idResult.isErr()) {
        return err(idResult.unwrapErr());
      }
      const userId = idResult.unwrap();

      const userResult = await this.userRepo.findById(userId);
      if (userResult.isErr()) {
        return err(new NotFoundError('Recipient', rawId));
      }

      recipientIds.push(userId);
    }

    // 4. Validate subject
    const subjectResult = Subject.create(dto.subject);
    if (subjectResult.isErr()) {
      return err(subjectResult.unwrapErr());
    }
    const subject = subjectResult.unwrap();

    // 5. Validate body (optional — can be empty)
    const bodyResult = MessageBody.create(dto.body ?? '');
    if (bodyResult.isErr()) {
      return err(bodyResult.unwrapErr());
    }
    const body = bodyResult.unwrap();

    // 6. Create domain entity
    const messageResult = Message.create(senderId, subject, body, recipientIds);
    if (messageResult.isErr()) {
      return err(messageResult.unwrapErr());
    }
    const message = messageResult.unwrap();

    // 7. Persist
    const saveResult = await this.messageRepo.save(message);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 8. Emit domain event
    const event = new MessageSent(
      message.getId(),
      message.getSenderId(),
      message.getRecipients().map((r) => r.getRecipientId()),
    );
    this.eventBus.publish(event);

    // 9. Build response
    return ok(this.toResponse(message, sender.getName()));
  }

  private toResponse(message: Message, senderName: string): MessageResponse {
    return {
      id: message.getId().get(),
      senderId: message.getSenderId().get(),
      senderName,
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
    };
  }
}
