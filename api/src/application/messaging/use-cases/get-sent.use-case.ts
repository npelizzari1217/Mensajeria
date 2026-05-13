import {
  UserId,
  MessageRepository,
  Result,
  ok,
} from '@mensajeria/domain';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * GetSentUseCase.
 *
 * Lists paginated messages sent by the authenticated user.
 */
export class GetSentUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
  ) {}

  async execute(dto: {
    userId: string;
    page: number;
    pageSize: number;
  }): Promise<Result<{
    data: MessageResponse[];
    total: number;
    page: number;
    pageSize: number;
  }, Error>> {
    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isErr()) {
      return userIdResult as any;
    }
    const userId = userIdResult.unwrap();

    const page = Math.max(1, dto.page || 1);
    const pageSize = Math.min(100, Math.max(1, dto.pageSize || 20));

    const result = await this.messageRepo.findBySender(userId, { page, pageSize });
    if (result.isErr()) {
      return result as any;
    }

    const paginated = result.unwrap();
    const data = paginated.data.map((msg) => ({
      id: msg.getId().get(),
      senderId: msg.getSenderId().get(),
      senderName: msg.getSenderName() ?? '',
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

    return ok({ data, total: paginated.total, page: paginated.page, pageSize: paginated.pageSize });
  }
}
