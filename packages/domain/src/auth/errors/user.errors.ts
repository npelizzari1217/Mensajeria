import { DomainError } from '../../shared/errors/domain-error';

/**
 * Error when a user is not found by ID or email.
 */
export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';

  constructor(idOrEmail: string) {
    super(`User '${idOrEmail}' not found`);
  }
}

/**
 * Error when attempting to register with an already-used email.
 */
export class EmailAlreadyExistsError extends DomainError {
  readonly code = 'EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`Email '${email}' is already registered`);
  }
}

/**
 * Error when login credentials don't match.
 * Same message regardless of whether the email exists (prevents enumeration).
 */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid email or password');
  }
}
