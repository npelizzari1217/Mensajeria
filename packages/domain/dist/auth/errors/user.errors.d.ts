import { DomainError } from '../../shared/errors/domain-error';
/**
 * Error when a user is not found by ID or email.
 */
export declare class UserNotFoundError extends DomainError {
    readonly code = "USER_NOT_FOUND";
    constructor(idOrEmail: string);
}
/**
 * Error when attempting to register with an already-used email.
 */
export declare class EmailAlreadyExistsError extends DomainError {
    readonly code = "EMAIL_ALREADY_EXISTS";
    constructor(email: string);
}
/**
 * Error when login credentials don't match.
 * Same message regardless of whether the email exists (prevents enumeration).
 */
export declare class InvalidCredentialsError extends DomainError {
    readonly code = "INVALID_CREDENTIALS";
    constructor();
}
//# sourceMappingURL=user.errors.d.ts.map