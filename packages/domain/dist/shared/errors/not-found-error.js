"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const domain_error_1 = require("./domain-error");
/**
 * Generic not-found error for any aggregate.
 *
 * @example
 * return err(new NotFoundError('User', userId.get()))
 */
class NotFoundError extends domain_error_1.DomainError {
    code = 'NOT_FOUND';
    constructor(entityName, id) {
        super(`${entityName} with id '${id}' not found`);
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=not-found-error.js.map