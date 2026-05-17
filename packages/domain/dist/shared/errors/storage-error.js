"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageError = void 0;
const domain_error_1 = require("./domain-error");
/**
 * StorageError — raised when file I/O operations fail in a storage adapter.
 *
 * Typically wraps an underlying OS/filesystem error. The `cause` field
 * carries the original error for debugging.
 *
 * @example
 * throw new StorageError('Failed to write file', originalError);
 */
class StorageError extends domain_error_1.DomainError {
    code = 'STORAGE_ERROR';
    constructor(message, cause) {
        super(message);
        this.cause = cause instanceof Error ? cause : undefined;
    }
}
exports.StorageError = StorageError;
//# sourceMappingURL=storage-error.js.map