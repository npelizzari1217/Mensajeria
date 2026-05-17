"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRecipient = void 0;
const message_status_1 = require("../../shared/value-objects/message-status");
const timestamp_1 = require("../../shared/value-objects/timestamp");
const result_1 = require("../../shared/result");
/**
 * MessageRecipient entity.
 *
 * Tracks the delivery status of a message to a specific recipient.
 * Part of the Message aggregate — created and managed through Message.
 *
 * Status transitions:
 *   PENDING → DELIVERED → READ
 *   PENDING → READ (when message is read before explicit delivery)
 *   Status is idempotent: marking already-Read as Read is a no-op.
 */
class MessageRecipient {
    messageId;
    recipientId;
    status;
    receivedAt;
    readAt;
    createdAt;
    _recipientName;
    constructor(messageId, recipientId, status, receivedAt, readAt, createdAt, _recipientName) {
        this.messageId = messageId;
        this.recipientId = recipientId;
        this.status = status;
        this.receivedAt = receivedAt;
        this.readAt = readAt;
        this.createdAt = createdAt;
        this._recipientName = _recipientName;
    }
    static create(messageId, recipientId) {
        return new MessageRecipient(messageId, recipientId, message_status_1.MessageStatusVO.reconstruct(message_status_1.MessageStatus.Pending), null, null, timestamp_1.Timestamp.now());
    }
    static reconstruct(props) {
        return new MessageRecipient(props.messageId, props.recipientId, props.status, props.receivedAt ?? null, props.readAt ?? null, props.createdAt, props.recipientName);
    }
    // --- Identity ---
    getMessageId() {
        return this.messageId;
    }
    getRecipientId() {
        return this.recipientId;
    }
    getStatus() {
        return this.status;
    }
    getReceivedAt() {
        return this.receivedAt;
    }
    getReadAt() {
        return this.readAt;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    /**
     * Returns the display name of the recipient user.
     * Transient — populated by the mapper from Prisma joins, not persisted.
     */
    getRecipientName() {
        return this._recipientName;
    }
    // --- Behavior ---
    /**
     * Marks the message as delivered to this recipient.
     * No-op if already in DELIVERED or READ state.
     */
    markAsDelivered() {
        if (this.status.get() === message_status_1.MessageStatus.Read) {
            return (0, result_1.err)(new Error('Cannot mark a read message as delivered'));
        }
        if (this.status.get() === message_status_1.MessageStatus.Delivered) {
            return (0, result_1.ok)(undefined); // idempotent
        }
        this.status = message_status_1.MessageStatusVO.reconstruct(message_status_1.MessageStatus.Delivered);
        this.receivedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(undefined);
    }
    /**
     * Marks the message as read by this recipient.
     * Idempotent — calling twice keeps the original readAt.
     */
    markAsRead() {
        if (this.status.get() === message_status_1.MessageStatus.Read) {
            return (0, result_1.ok)(undefined); // idempotent — keep original readAt
        }
        this.status = message_status_1.MessageStatusVO.reconstruct(message_status_1.MessageStatus.Read);
        if (!this.receivedAt) {
            this.receivedAt = timestamp_1.Timestamp.now();
        }
        this.readAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(undefined);
    }
    /**
     * Checks if this recipient has read the message.
     */
    hasRead() {
        return this.status.get() === message_status_1.MessageStatus.Read;
    }
    equals(other) {
        return (this.messageId.equals(other.messageId) &&
            this.recipientId.equals(other.recipientId));
    }
}
exports.MessageRecipient = MessageRecipient;
//# sourceMappingURL=message-recipient.js.map