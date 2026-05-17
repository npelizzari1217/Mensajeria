import { DomainError } from '../../shared/errors/domain-error';
/**
 * Error when a message is not found by ID.
 */
export declare class MessageNotFoundError extends DomainError {
    readonly code = "MESSAGE_NOT_FOUND";
    constructor(id: string);
}
/**
 * Error when a user tries to access a message they are not
 * a sender or recipient of.
 */
export declare class UnauthorizedMessageAccessError extends DomainError {
    readonly code = "UNAUTHORIZED_MESSAGE_ACCESS";
    constructor(userId: string, messageId: string);
}
//# sourceMappingURL=message.errors.d.ts.map