"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStatusVO = exports.MessageStatus = void 0;
const result_1 = require("../result");
/**
 * MessageStatus enum — delivery lifecycle of a message to a recipient.
 *
 * PENDING  → initial state when message is sent
 * DELIVERED → recipient has received it (server-delivered)
 * READ     → recipient has opened/read it
 */
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["Pending"] = "Pending";
    MessageStatus["Sent"] = "Sent";
    MessageStatus["Delivered"] = "Delivered";
    MessageStatus["Read"] = "Read";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));
const VALID_STATUSES = Object.values(MessageStatus);
/**
 * MessageStatus Value Object.
 *
 * Wraps a MessageStatus enum with safe construction.
 * Ensures only valid delivery states are represented.
 */
class MessageStatusVO {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('MessageStatus cannot be empty'));
        }
        const normalized = raw.trim();
        const match = VALID_STATUSES.find((s) => s.toLowerCase() === normalized.toLowerCase());
        if (!match) {
            return (0, result_1.err)(new Error(`Invalid MessageStatus '${raw}'. Valid: ${VALID_STATUSES.join(', ')}`));
        }
        return (0, result_1.ok)(new MessageStatusVO(match));
    }
    static reconstruct(raw) {
        return new MessageStatusVO(raw);
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
    static pending() {
        return new MessageStatusVO(MessageStatus.Pending);
    }
}
exports.MessageStatusVO = MessageStatusVO;
//# sourceMappingURL=message-status.js.map