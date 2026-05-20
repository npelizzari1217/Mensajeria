import {
  Message,
  MessageId,
  EmpresaId,
  UserId,
  Subject,
  MessageBody,
  Timestamp,
  MessageRecipient,
  MessageStatus,
  MessageStatusVO,
} from '@mensajeria/domain';
import { Message as PrismaMessage, MessageRecipient as PrismaMessageRecipient, MessageStatus as PrismaMessageStatus } from '@prisma/client';

/**
 * Maps a domain MessageStatus to Prisma MessageStatus enum.
 */
function toPrismaStatus(status: MessageStatus): PrismaMessageStatus {
  const map: Record<MessageStatus, PrismaMessageStatus> = {
    [MessageStatus.Pending]: PrismaMessageStatus.PENDING,
    [MessageStatus.Sent]: PrismaMessageStatus.DELIVERED,
    [MessageStatus.Delivered]: PrismaMessageStatus.DELIVERED,
    [MessageStatus.Read]: PrismaMessageStatus.READ,
  };
  return map[status];
}

/**
 * Maps a Prisma MessageStatus to domain MessageStatus.
 * Prisma uses UPPERCASE enums, domain uses PascalCase.
 */
function toDomainStatus(status: PrismaMessageStatus): MessageStatus {
  const map: Record<PrismaMessageStatus, MessageStatus> = {
    [PrismaMessageStatus.PENDING]: MessageStatus.Pending,
    [PrismaMessageStatus.DELIVERED]: MessageStatus.Delivered,
    [PrismaMessageStatus.READ]: MessageStatus.Read,
  };
  return map[status];
}

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
        status: MessageStatusVO.reconstruct(toDomainStatus(r.status)),
        receivedAt: r.status === PrismaMessageStatus.PENDING ? null : Timestamp.reconstruct(r.createdAt),
        readAt: r.readAt ? Timestamp.reconstruct(r.readAt.toISOString()) : null,
        createdAt: Timestamp.reconstruct(r.createdAt.toISOString()),
        recipientName: r.recipient?.name,
      }),
    );

    return Message.reconstruct({
      id: MessageId.reconstruct(prismaMessage.id),
      empresaId: EmpresaId.reconstruct(prismaMessage.empresaId),
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
        status: PrismaMessageStatus;
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
          status: toPrismaStatus(r.getStatus().get()),
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
    status: PrismaMessageStatus;
    readAt: Date | null;
  } {
    return {
      status: toPrismaStatus(recipient.getStatus().get()),
      readAt: recipient.getReadAt() ? new Date(recipient.getReadAt()!.get()) : null,
    };
  }
}
