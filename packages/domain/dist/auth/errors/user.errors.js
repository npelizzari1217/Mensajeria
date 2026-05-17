"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidCredentialsError = exports.EmailAlreadyExistsError = exports.UserNotFoundError = void 0;
const domain_error_1 = require("../../shared/errors/domain-error");
/**
 * Error when a user is not found by ID or email.
 */
class UserNotFoundError extends domain_error_1.DomainError {
    code = 'USER_NOT_FOUND';
    constructor(idOrEmail) {
        super(`User '${idOrEmail}' not found`);
    }
}
exports.UserNotFoundError = UserNotFoundError;
/**
 * Error when attempting to register with an already-used email.
 */
class EmailAlreadyExistsError extends domain_error_1.DomainError {
    code = 'EMAIL_ALREADY_EXISTS';
    constructor(email) {
        super(`Email '${email}' is already registered`);
    }
}
exports.EmailAlreadyExistsError = EmailAlreadyExistsError;
/**
 * Error when login credentials don't match.
 * Same message regardless of whether the email exists (prevents enumeration).
 */
class InvalidCredentialsError extends domain_error_1.DomainError {
    code = 'INVALID_CREDENTIALS';
    constructor() {
        super('Invalid email or password');
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
//# sourceMappingURL=user.errors.js.map