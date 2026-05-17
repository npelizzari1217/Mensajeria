"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileId = void 0;
const result_1 = require("../result");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * FileId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a file attachment.
 * Unlike UserId/MessageId, create() generates a new UUID — consumers
 * do not supply their own ID; the domain owns identity generation.
 */
class FileId {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    /**
     * Factory for NEW file identities.
     * Generates a cryptographically random UUID v4 — no input needed.
     */
    static create() {
        return new FileId(crypto.randomUUID());
    }
    /**
     * Factory for NEW file identities from a provided UUID string.
     * Validates the format before constructing.
     */
    static createFrom(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('FileId cannot be empty'));
        }
        if (!UUID_REGEX.test(raw.trim())) {
            return (0, result_1.err)(new Error(`Invalid FileId format: '${raw}' is not a valid UUID`));
        }
        return (0, result_1.ok)(new FileId(raw.trim()));
    }
    /**
     * Trusted reconstruction for persistence — skips validation.
     * Use ONLY when restoring from a trusted source (DB, event store).
     */
    static reconstruct(raw) {
        return new FileId(raw);
    }
    get() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
}
exports.FileId = FileId;
//# sourceMappingURL=file-id.js.map