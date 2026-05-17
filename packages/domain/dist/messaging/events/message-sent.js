"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageSent = void 0;
/**
 * Domain event emitted when a message is successfully sent.
 *
 * Handlers can use this to trigger notifications, update analytics,
 * or process delivery rules.
 */
class MessageSent {
    messageId;
    senderId;
    recipientIds;
    eventName = 'MessageSent';
    occurredAt = new Date();
    constructor(messageId, senderId, recipientIds) {
        this.messageId = messageId;
        this.senderId = senderId;
        this.recipientIds = recipientIds;
    }
}
exports.MessageSent = MessageSent;
//# sourceMappingURL=message-sent.js.map