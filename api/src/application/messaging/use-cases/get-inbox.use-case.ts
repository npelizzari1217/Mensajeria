import {
  UserId,
  EmpresaId,
  MessageRepository,
  MessageStatus,
  MessageStatusVO,
  Result,
  ok,
} from '@mensajeria/domain';
import { InboxQueryDTO } from '../dtos/inbox-query.dto';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * GetInboxUseCase.
 *
 * Lists paginated messages where the authenticated user is a recipient.
 * Supports optional status filter: 'unread' (Pending/Delivered) or 'read'.
 */
export class GetInboxUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
  ) {}

  async execute(dto: InboxQueryDTO, empresaId: EmpresaId): Promise<Result<{
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

    // Map filter to domain status
    let statusFilter: MessageStatusVO | undefined;
    if (dto.filter === 'read') {
      statusFilter = MessageStatusVO.reconstruct(MessageStatus.Read);
    } else if (dto.filter === 'unread') {
      // For inbox, "unread" means not read yet: a combination of Pending/Delivered
      // We pass 'Pending' as the representative and let the repo use OR logic
      statusFilter = MessageStatusVO.reconstruct(MessageStatus.Pending);
    }

    const page = Math.max(1, dto.page || 1);
    const pageSize = Math.min(100, Math.max(1, dto.pageSize || 20));

    const result = await this.messageRepo.findByRecipient(userId, empresaId, statusFilter, {
      page,
      pageSize,
    });

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
