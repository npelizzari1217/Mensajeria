"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageId = void 0;
const result_1 = require("../result");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * MessageId Value Object.
 *
 * Wraps a UUID string that uniquely identifies a message.
 */
class MessageId {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('MessageId cannot be empty'));
        }
        if (!UUID_REGEX.test(raw.trim())) {
            return (0, result_1.err)(new Error(`Invalid MessageId format: '${raw}' is not a valid UUID`));
        }
        return (0, result_1.ok)(new MessageId(raw.trim()));
    }
    static reconstruct(raw) {
        return new MessageId(raw);
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
exports.MessageId = MessageId;
//# sourceMappingURL=message-id.js.map