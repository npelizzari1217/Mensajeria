import { DomainError } from '../../shared/errors/domain-error';

/**
 * Error when a draft is not found by ID.
 */
export class DraftNotFoundError extends DomainError {
  readonly code = 'DRAFT_NOT_FOUND';

  constructor(id: string) {
    super(`Draft '${id}' not found`);
  }
}
