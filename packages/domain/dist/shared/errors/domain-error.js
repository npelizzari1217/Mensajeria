"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainError = void 0;
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
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            name: this.name,
        };
    }
}
exports.DomainError = DomainError;
//# sourceMappingURL=domain-error.js.map