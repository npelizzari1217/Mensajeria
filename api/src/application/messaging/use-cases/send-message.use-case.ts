import {
  Message,
  MessageId,
  UserId,
  Email,
  EmpresaId,
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
  User,
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

  async execute(dto: SendMessageDTO, empresaId: EmpresaId): Promise<Result<MessageResponse, Error>> {
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

    // 3. Validate recipientEmails and resolve to UserIds
    if (!dto.recipientEmails || dto.recipientEmails.length === 0) {
      return err(new Error('Message must have at least one recipient'));
    }

    const recipients: User[] = [];
    for (const rawEmail of dto.recipientEmails) {
      const emailResult = Email.create(rawEmail);
      if (emailResult.isErr()) {
        return err(emailResult.unwrapErr());
      }

      const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
      if (userResult.isErr()) {
        return err(new NotFoundError('Recipient', rawEmail));
      }

      recipients.push(userResult.unwrap());
    }

    const recipientIds = recipients.map((u) => u.getId());

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
    const messageResult = Message.create(senderId, empresaId, subject, body, recipientIds);
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
