import {
  Message,
  MessageId,
  UserId,
  Subject,
  MessageBody,
  Timestamp,
  MessageRecipient,
  MessageStatusVO,
} from '@mensajeria/domain';
import { Message as PrismaMessage, MessageRecipient as PrismaMessageRecipient, MessageStatus } from '@prisma/client';

/**
 * Prisma recipient type including related user info.
 */
type PrismaRecipientWithUser = PrismaMessageRecipient & {
  recipient?: { name: string } | null;
};

/**
 * Combined Prisma message type including related recipients and sender.
 */
type PrismaMessageWithRecipients = PrismaMessage & {
  recipients?: PrismaRecipientWithUser[];
  sender?: { id: string; name: string } | null;
};

/**
 * MessageMapper — converts between Prisma Message model and domain Message entity.
 *
 * Stateless — call static methods directly.
 * toDomain: Prisma → Domain (uses reconstruct for trusted DB data)
 * toPrisma: Domain → Prisma create/update input
 */
export class MessageMapper {
  /**
   * Converts a Prisma Message (with recipients) to a domain Message entity.
   */
  static toDomain(prismaMessage: PrismaMessageWithRecipients): Message {
    const recipients = (prismaMessage.recipients ?? []).map((r) =>
      MessageRecipient.reconstruct({
        messageId: MessageId.reconstruct(r.messageId),
        recipientId: UserId.reconstruct(r.recipientId),
        status: MessageStatusVO.reconstruct(r.status),
        receivedAt: r.status === MessageStatus.PENDING ? null : Timestamp.reconstruct(r.createdAt),
        readAt: r.readAt ? Timestamp.reconstruct(r.readAt.toISOString()) : null,
        createdAt: Timestamp.reconstruct(r.createdAt.toISOString()),
        recipientName: r.recipient?.name,
      }),
    );

    return Message.reconstruct({
      id: MessageId.reconstruct(prismaMessage.id),
      senderId: UserId.reconstruct(prismaMessage.senderId),
      subject: Subject.reconstruct(prismaMessage.subject),
      body: MessageBody.reconstruct(prismaMessage.body),
      parentMessageId: prismaMessage.parentMessageId
        ? MessageId.reconstruct(prismaMessage.parentMessageId)
        : null,
      createdAt: Timestamp.reconstruct(prismaMessage.createdAt.toISOString()),
      recipients,
      senderName: prismaMessage.sender?.name,
    });
  }

  /**
   * Converts a domain Message to Prisma-compatible create data.
   * Includes recipients for nested create.
   */
  static toPrisma(message: Message): {
    id: string;
    senderId: string;
    subject: string;
    body: string;
    parentMessageId: string | null;
    createdAt: Date;
    recipients: {
      create: Array<{
        id: string;
        recipientId: string;
        status: MessageStatus;
        readAt: Date | null;
        createdAt: Date;
      }>;
    };
  } {
    return {
      id: message.getId().get(),
      senderId: message.getSenderId().get(),
      subject: message.getSubject().get(),
      body: message.getBody().get(),
      parentMessageId: message.getParentMessageId()?.get() ?? null,
      createdAt: new Date(message.getCreatedAt().get()),
      recipients: {
        create: message.getRecipients().map((r) => ({
          id: crypto.randomUUID(),
          recipientId: r.getRecipientId().get(),
          status: r.getStatus().get() as MessageStatus,
          readAt: r.getReadAt() ? new Date(r.getReadAt()!.get()) : null,
          createdAt: new Date(r.getCreatedAt().get()),
        })),
      },
    };
  }

  /**
   * Converts a domain MessageRecipient to Prisma update data.
   */
  static recipientToPrisma(recipient: MessageRecipient): {
    status: MessageStatus;
    readAt: Date | null;
  } {
    return {
      status: recipient.getStatus().get() as MessageStatus,
      readAt: recipient.getReadAt() ? new Date(recipient.getReadAt()!.get()) : null,
    };
  }
}
