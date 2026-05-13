import { Message } from '../entities/message';
import { MessageRecipient } from '../entities/message-recipient';
import { MessageId } from '../../shared/value-objects/message-id';
import { UserId } from '../../shared/value-objects/user-id';
import { MessageStatusVO } from '../../shared/value-objects/message-status';
import { Result } from '../../shared/result';
import { DomainError } from '../../shared/errors/domain-error';

/**
 * Pagination parameters for repository queries.
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated result containing data and metadata.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * MessageRepository port.
 *
 * Defines the contract for persisting and retrieving Message aggregates.
 * Implementation belongs in infrastructure/ (PrismaMessageRepository).
 *
 * All methods return `Result<T, DomainError>` — never throw.
 */
export interface MessageRepository {
  /**
   * Finds a message by its unique ID.
   * Returns MessageNotFoundError if not found.
   */
  findById(id: MessageId): Promise<Result<Message, DomainError>>;

  /**
   * Finds messages where the given user is a recipient.
   * Supports optional status filter and pagination.
   */
  findByRecipient(
    userId: UserId,
    status?: MessageStatusVO,
    pagination?: PaginationParams,
  ): Promise<Result<PaginatedResult<Message>, DomainError>>;

  /**
   * Finds messages sent by the given user.
   * Supports optional pagination.
   */
  findBySender(
    userId: UserId,
    pagination?: PaginationParams,
  ): Promise<Result<PaginatedResult<Message>, DomainError>>;

  /**
   * Persists a message (create or update) along with its recipients.
   */
  save(message: Message): Promise<Result<void, DomainError>>;

  /**
   * Updates a single recipient's status (e.g., mark as read).
   */
  saveRecipient(recipient: MessageRecipient): Promise<Result<void, DomainError>>;

  /**
   * Finds the full thread chain for a given message.
   * Walks the parentMessageId chain to return all messages in the thread,
   * ordered by sentAt ascending.
   */
  findThread(messageId: MessageId): Promise<Result<Message[], DomainError>>;
}
