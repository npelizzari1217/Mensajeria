import {
  Message,
  MessageId,
  UserId,
  MessageRecipient,
  MessageRepository,
  PaginationParams,
  PaginatedResult,
  MessageStatus as DomainMessageStatus,
  MessageStatusVO,
  NotFoundError,
  Result,
  ok,
  err,
  DomainError,
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { MessageMapper } from '../mappers/message-mapper';
import { Prisma, MessageStatus as PrismaMessageStatus } from '@prisma/client';

/**
 * PrismaMessageRepository — infrastructure adapter implementing MessageRepository.
 *
 * Uses PrismaService for database access and MessageMapper for conversions.
 */
export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: MessageId): Promise<Result<Message, DomainError>> {
    const row = await this.prisma.message.findUnique({
      where: { id: id.get() },
      include: {
        recipients: {
          include: {
            recipient: { select: { name: true } },
          },
        },
        sender: { select: { id: true, name: true } },
      },
    });

    if (!row) {
      return err(new NotFoundError('Message', id.get()));
    }

    return ok(MessageMapper.toDomain(row));
  }

  async findByRecipient(
    userId: UserId,
    status?: MessageStatusVO,
    pagination?: PaginationParams,
  ): Promise<Result<PaginatedResult<Message>, DomainError>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.MessageRecipientWhereInput = {
      recipientId: userId.get(),
    };

    if (status) {
      const statusValue = status.get();

      if (statusValue === DomainMessageStatus.Pending) {
        // For "unread" filter, match PENDING + DELIVERED
        where.status = { in: [PrismaMessageStatus.PENDING, PrismaMessageStatus.DELIVERED] };
      } else {
        // Map domain status to Prisma status
        const statusMap: Record<DomainMessageStatus, PrismaMessageStatus> = {
          [DomainMessageStatus.Pending]: PrismaMessageStatus.PENDING,
          [DomainMessageStatus.Sent]: PrismaMessageStatus.DELIVERED,
          [DomainMessageStatus.Delivered]: PrismaMessageStatus.DELIVERED,
          [DomainMessageStatus.Read]: PrismaMessageStatus.READ,
        };
        where.status = statusMap[statusValue];
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.messageRecipient.findMany({
        where,
        include: {
          message: {
            include: {
              recipients: {
                include: {
                  recipient: { select: { name: true } },
                },
              },
              sender: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.messageRecipient.count({ where }),
    ]);

    const data = rows.map((r) => MessageMapper.toDomain(r.message));

    return ok({ data, total, page, pageSize });
  }

  async findBySender(
    userId: UserId,
    pagination?: PaginationParams,
  ): Promise<Result<PaginatedResult<Message>, DomainError>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.MessageWhereInput = {
      senderId: userId.get(),
    };

    const [rows, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        include: {
          recipients: {
            include: {
              recipient: { select: { name: true } },
            },
          },
          sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.message.count({ where }),
    ]);

    const data = rows.map((r) => MessageMapper.toDomain(r));

    return ok({ data, total, page, pageSize });
  }

  async save(message: Message): Promise<Result<void, DomainError>> {
    const data = MessageMapper.toPrisma(message);

    await this.prisma.message.create({
      data: {
        id: data.id,
        senderId: data.senderId,
        subject: data.subject,
        body: data.body,
        parentMessageId: data.parentMessageId,
        createdAt: data.createdAt,
        recipients: data.recipients,
      },
    });

    return ok(undefined);
  }

  async saveRecipient(recipient: MessageRecipient): Promise<Result<void, DomainError>> {
    const data = MessageMapper.recipientToPrisma(recipient);

    await this.prisma.messageRecipient.updateMany({
      where: {
        messageId: recipient.getMessageId().get(),
        recipientId: recipient.getRecipientId().get(),
      },
      data: {
        status: data.status,
        readAt: data.readAt,
      },
    });

    return ok(undefined);
  }

  async findThread(messageId: MessageId): Promise<Result<Message[], DomainError>> {
    // Walk the parentMessageId chain to find all messages in the thread.
    // Collect ancestor chain (oldest first) and descendants in a single query.
    const root = await this.prisma.message.findUnique({
      where: { id: messageId.get() },
      select: { parentMessageId: true, createdAt: true },
    });

    if (!root) {
      return err(new NotFoundError('Message', messageId.get()));
    }

    // Find root of thread (message with no parent)
    let rootId = messageId.get();
    let currentParentId: string | null = root.parentMessageId;

    // Walk up to find the root
    while (currentParentId) {
      const parent = await this.prisma.message.findUnique({
        where: { id: currentParentId },
        select: { id: true, parentMessageId: true },
      });
      if (!parent) break;
      rootId = parent.id;
      currentParentId = parent.parentMessageId;
    }

    // Now find all messages that share this root chain
    // We fetch by following the chain downward using parentMessageId links
    const allMessages: Message[] = [];
    const visited = new Set<string>();

    // Collect all messages that are linked through parentMessageId starting from root
    await this.collectThreadMessages(rootId, visited, allMessages);

    // Sort by sentAt ascending
    allMessages.sort((a, b) => a.getCreatedAt().get().getTime() - b.getCreatedAt().get().getTime());

    return ok(allMessages);
  }

  async search(
    userId: UserId,
    query: string,
    pagination: PaginationParams,
  ): Promise<Result<PaginatedResult<Message>, DomainError>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    // Use %L: string literal interpolation for safety with tsquery
    // $1, $2 etc. for safe parameter binding of user-supplied values
    const searchClause = `
      to_tsvector('spanish', coalesce(m.subject, '') || ' ' || coalesce(m.body, ''))
      @@ plainto_tsquery('spanish', $1)
    `;

    const accessClause = `
      m.sender_id = $2
      OR EXISTS (
        SELECT 1 FROM message_recipients mr
        WHERE mr.message_id = m.message_id AND mr.recipient_id = $2
      )
    `;

    const whereClause = `${searchClause} AND ${accessClause}`;

    // Count total matches
    const countRows = await this.prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
      `SELECT COUNT(*)::bigint as total FROM messages m WHERE ${whereClause}`,
      query,
      userId.get(),
    );
    const total = Number(countRows[0]?.total ?? 0);

    // Get paginated matching IDs ordered by relevance (ts_rank), then by creation date
    const rows = await this.prisma.$queryRawUnsafe<Array<{ message_id: string }>>(
      `SELECT m.message_id FROM messages m WHERE ${whereClause}
       ORDER BY ts_rank(to_tsvector('spanish', coalesce(m.subject, '') || ' ' || coalesce(m.body, '')), plainto_tsquery('spanish', $1)) DESC, m.created_at DESC
       LIMIT $3 OFFSET $4`,
      query,
      userId.get(),
      pageSize,
      skip,
    );

    const ids = rows.map((r) => r.message_id);
    if (ids.length === 0) {
      return ok({ data: [], total: 0, page, pageSize });
    }

    // Fetch full message data with relations
    const messages = await this.prisma.message.findMany({
      where: { id: { in: ids } },
      include: {
        recipients: {
          include: { recipient: { select: { name: true } } },
        },
        sender: { select: { id: true, name: true } },
      },
    });

    // Preserve the ORDER BY from the search query
    const idOrder = new Map(ids.map((id, i) => [id, i]));
    messages.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

    const data = messages.map((r) => MessageMapper.toDomain(r));

    return ok({ data, total, page, pageSize });
  }

  private async collectThreadMessages(
    currentId: string,
    visited: Set<string>,
    acc: Message[],
  ): Promise<void> {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const row = await this.prisma.message.findUnique({
      where: { id: currentId },
      include: {
        recipients: {
          include: {
            recipient: { select: { name: true } },
          },
        },
        sender: { select: { id: true, name: true } },
      },
    });

    if (!row) return;

    acc.push(MessageMapper.toDomain(row));

    // Find all replies to this message
    const replies = await this.prisma.message.findMany({
      where: { parentMessageId: currentId },
      include: {
        recipients: {
          include: {
            recipient: { select: { name: true } },
          },
        },
        sender: { select: { id: true, name: true } },
      },
    });

    for (const reply of replies) {
      await this.collectThreadMessages(reply.id, visited, acc);
    }
  }
}
