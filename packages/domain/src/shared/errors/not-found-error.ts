import { DomainError } from './domain-error';

/**
 * Generic not-found error for any aggregate.
 *
 * @example
 * return err(new NotFoundError('User', userId.get()))
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' not found`);
  }
}
