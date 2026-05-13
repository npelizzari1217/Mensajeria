import { DomainError } from '../../shared/errors/domain-error';

/**
 * Error when a message is not found by ID.
 */
export class MessageNotFoundError extends DomainError {
  readonly code = 'MESSAGE_NOT_FOUND';

  constructor(id: string) {
    super(`Message '${id}' not found`);
  }
}

/**
 * Error when a user tries to access a message they are not
 * a sender or recipient of.
 */
export class UnauthorizedMessageAccessError extends DomainError {
  readonly code = 'UNAUTHORIZED_MESSAGE_ACCESS';

  constructor(userId: string, messageId: string) {
    super(`User '${userId}' is not authorized to access message '${messageId}'`);
  }
}
