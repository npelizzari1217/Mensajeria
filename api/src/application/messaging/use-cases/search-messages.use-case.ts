import {
  UserId,
  EmpresaId,
  MessageRepository,
  PaginatedResult,
  Result,
  ok,
  err,
  DomainError,
  ValidationError,
  Message,
  EventBus,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { MessageResponse } from '../dtos/message-response.dto';

/**
 * SearchMessagesUseCase.
 *
 * Performs full-text search across messages the authenticated user
 * has access to (sent or received). Uses PostgreSQL tsvector with
 * Spanish configuration for stemming and stop-word handling.
 */
export class SearchMessagesUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
    @Inject('EventBus') private readonly eventBus: EventBus,
  ) {}

  async execute(dto: {
    userId: string;
    query: string;
    page: number;
    pageSize: number;
  }, empresaId: EmpresaId): Promise<Result<{
    data: MessageResponse[];
    total: number;
    page: number;
    pageSize: number;
  }, DomainError>> {
    // 1. Validate query length
    const trimmedQuery = dto.query?.trim() ?? '';
    if (trimmedQuery.length < 2) {
      return err(new ValidationError('Search query must be at least 2 characters'));
    }
    if (trimmedQuery.length > 200) {
      return err(new ValidationError('Search query must be at most 200 characters'));
    }

    // 2. Validate userId
    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isErr()) {
      return err(new ValidationError('Invalid user ID'));
    }
    const userId = userIdResult.unwrap();

    // 3. Validate pagination
    const page = Math.max(1, dto.page || 1);
    const rawPageSize = dto.pageSize || 20;
    if (rawPageSize > 100) {
      return err(new ValidationError('pageSize must not exceed 100'));
    }
    const pageSize = Math.max(1, rawPageSize);

    // 4. Search
    const result = await this.messageRepo.search(userId, empresaId, trimmedQuery, {
      page,
      pageSize,
    });

    if (result.isErr()) {
      return result as unknown as Result<{ data: MessageResponse[]; total: number; page: number; pageSize: number }, DomainError>;
    }

    const paginated = result.unwrap();

    // 5. Map domain entities to response DTOs
    const data = paginated.data.map((msg: Message) => this.toResponse(msg));

    return ok({ data, total: paginated.total, page: paginated.page, pageSize: paginated.pageSize });
  }

  private toResponse(msg: Message): MessageResponse {
    return {
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
    };
  }
}
