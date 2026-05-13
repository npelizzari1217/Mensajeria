import { DomainError } from './domain-error';

/**
 * StorageError — raised when file I/O operations fail in a storage adapter.
 *
 * Typically wraps an underlying OS/filesystem error. The `cause` field
 * carries the original error for debugging.
 *
 * @example
 * throw new StorageError('Failed to write file', originalError);
 */
export class StorageError extends DomainError {
  readonly code = 'STORAGE_ERROR';

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause instanceof Error ? cause : undefined;
  }
}
