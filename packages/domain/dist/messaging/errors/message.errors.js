"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedMessageAccessError = exports.MessageNotFoundError = void 0;
const domain_error_1 = require("../../shared/errors/domain-error");
/**
 * Error when a message is not found by ID.
 */
class MessageNotFoundError extends domain_error_1.DomainError {
    code = 'MESSAGE_NOT_FOUND';
    constructor(id) {
        super(`Message '${id}' not found`);
    }
}
exports.MessageNotFoundError = MessageNotFoundError;
/**
 * Error when a user tries to access a message they are not
 * a sender or recipient of.
 */
class UnauthorizedMessageAccessError extends domain_error_1.DomainError {
    code = 'UNAUTHORIZED_MESSAGE_ACCESS';
    constructor(userId, messageId) {
        super(`User '${userId}' is not authorized to access message '${messageId}'`);
    }
}
exports.UnauthorizedMessageAccessError = UnauthorizedMessageAccessError;
//# sourceMappingURL=message.errors.js.map