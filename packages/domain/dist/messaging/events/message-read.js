"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRead = void 0;
/**
 * Domain event emitted when a recipient marks a message as read.
 *
 * Handlers can use this to update read receipts, notify senders,
 * or trigger follow-up actions.
 */
class MessageRead {
    messageId;
    recipientId;
    readAt;
    eventName = 'MessageRead';
    occurredAt = new Date();
    constructor(messageId, recipientId, readAt) {
        this.messageId = messageId;
        this.recipientId = recipientId;
        this.readAt = readAt;
    }
}
exports.MessageRead = MessageRead;
//# sourceMappingURL=message-read.js.map