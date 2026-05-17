"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const domain_error_1 = require("./domain-error");
/**
 * ValidationError — raised when input validation fails in a use case.
 *
 * Carries a machine-readable code and a human-readable message
 * describing what was invalid.
 *
 * @example
 * return err(new ValidationError('INVALID_QUERY', 'Query must be at least 2 characters'));
 */
class ValidationError extends domain_error_1.DomainError {
    detail;
    code = 'VALIDATION_ERROR';
    constructor(detail) {
        super(detail);
        this.detail = detail;
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=validation-error.js.map