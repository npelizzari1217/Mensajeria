"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftNotFoundError = void 0;
const domain_error_1 = require("../../shared/errors/domain-error");
/**
 * Error when a draft is not found by ID.
 */
class DraftNotFoundError extends domain_error_1.DomainError {
    code = 'DRAFT_NOT_FOUND';
    constructor(id) {
        super(`Draft '${id}' not found`);
    }
}
exports.DraftNotFoundError = DraftNotFoundError;
//# sourceMappingURL=draft.errors.js.map