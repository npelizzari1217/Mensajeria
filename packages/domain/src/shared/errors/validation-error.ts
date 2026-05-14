import { DomainError } from './domain-error';

/**
 * ValidationError — raised when input validation fails in a use case.
 *
 * Carries a machine-readable code and a human-readable message
 * describing what was invalid.
 *
 * @example
 * return err(new ValidationError('INVALID_QUERY', 'Query must be at least 2 characters'));
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor(
    public readonly detail: string,
  ) {
    super(detail);
  }
}
