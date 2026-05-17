"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBody = void 0;
const result_1 = require("../result");
const MAX_LENGTH = 10_000;
/**
 * MessageBody Value Object.
 *
 * Validates message body length constraints (max 10,000 chars).
 * Does NOT enforce a minimum — an empty body is allowed (e.g.
 * for messages where the subject is sufficient context).
 */
class MessageBody {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (raw === undefined || raw === null) {
            return (0, result_1.err)(new Error('Message body cannot be null or undefined'));
        }
        const normalized = raw.trim();
        if (normalized.length > MAX_LENGTH) {
            return (0, result_1.err)(new Error(`Message body must not exceed ${MAX_LENGTH} characters (got ${normalized.length})`));
        }
        return (0, result_1.ok)(new MessageBody(normalized));
    }
    static reconstruct(raw) {
        return new MessageBody(raw);
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
exports.MessageBody = MessageBody;
//# sourceMappingURL=message-body.js.map