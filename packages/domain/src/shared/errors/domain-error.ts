/**
 * Base class for all domain errors.
 *
 * Every domain error MUST extend this class and provide a unique,
 * machine-readable `code` for clients to match on (API layer maps
 * codes to HTTP status codes).
 *
 * @example
 * class UserNotFoundError extends DomainError {
 *   readonly code = 'USER_NOT_FOUND';
 *   constructor(id: string) {
 *     super(`User with id ${id} not found`);
 *   }
 * }
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
    };
  }
}
