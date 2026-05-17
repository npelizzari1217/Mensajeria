"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const message_id_1 = require("../../shared/value-objects/message-id");
const timestamp_1 = require("../../shared/value-objects/timestamp");
const result_1 = require("../../shared/result");
const message_recipient_1 = require("./message-recipient");
/**
 * Message entity — aggregate root for the Messaging bounded context.
 *
 * Encapsulates a message with its sender, subject, body, optional
 * parent message (for replies), and a list of recipients.
 *
 * Behavior methods enforce domain invariants:
 * - Sender cannot be a recipient (no self-messaging)
 * - Recipients must be unique
 * - Recipient status transitions through PENDING → DELIVERED → READ
 */
class Message {
    id;
    senderId;
    subject;
    body;
    parentMessageId;
    createdAt;
    recipients;
    _senderName;
    constructor(id, senderId, subject, body, parentMessageId, createdAt, recipients, _senderName) {
        this.id = id;
        this.senderId = senderId;
        this.subject = subject;
        this.body = body;
        this.parentMessageId = parentMessageId;
        this.createdAt = createdAt;
        this.recipients = recipients;
        this._senderName = _senderName;
    }
    /**
     * Factory for NEW messages.
     * Creates the message and initial MessageRecipient entries.
     */
    static create(senderId, subject, body, recipientIds, parentMessageId) {
        if (recipientIds.length === 0) {
            return (0, result_1.err)(new Error('Message must have at least one recipient'));
        }
        // Check for self-messaging
        if (recipientIds.some((r) => r.equals(senderId))) {
            return (0, result_1.err)(new Error('Sender cannot be a recipient of their own message'));
        }
        // Check for duplicate recipients
        const seen = new Set();
        for (const r of recipientIds) {
            const key = r.get();
            if (seen.has(key)) {
                return (0, result_1.err)(new Error(`Duplicate recipient: ${r.get()}`));
            }
            seen.add(key);
        }
        const id = message_id_1.MessageId.reconstruct(crypto.randomUUID());
        const recipients = recipientIds.map((r) => message_recipient_1.MessageRecipient.create(id, r));
        return (0, result_1.ok)(new Message(id, senderId, subject, body, parentMessageId ?? null, timestamp_1.Timestamp.now(), recipients));
    }
    /**
     * Reconstruction from persistence — skips runtime validation.
     * Use ONLY when restoring from a trusted source (DB).
     */
    static reconstruct(props) {
        return new Message(props.id, props.senderId, props.subject, props.body, props.parentMessageId, props.createdAt, props.recipients, props.senderName);
    }
    // --- Identity ---
    getId() {
        return this.id;
    }
    getSenderId() {
        return this.senderId;
    }
    /**
     * Returns the display name of the sender user.
     * Transient — populated by the mapper from Prisma joins, not persisted.
     */
    getSenderName() {
        return this._senderName;
    }
    getSubject() {
        return this.subject;
    }
    getBody() {
        return this.body;
    }
    getParentMessageId() {
        return this.parentMessageId;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getRecipients() {
        return [...this.recipients];
    }
    // --- Behavior ---
    /**
     * Adds a recipient to this message.
     * Returns error if the recipient already exists.
     */
    addRecipient(recipientId) {
        if (recipientId.equals(this.senderId)) {
            return (0, result_1.err)(new Error('Sender cannot be a recipient of their own message'));
        }
        const exists = this.recipients.some((r) => r.getRecipientId().equals(recipientId));
        if (exists) {
            return (0, result_1.err)(new Error(`Recipient ${recipientId} already added`));
        }
        this.recipients.push(message_recipient_1.MessageRecipient.create(this.id, recipientId));
        return (0, result_1.ok)(undefined);
    }
    /**
     * Gets the recipient entry for a given user, if they are a recipient.
     */
    getRecipient(userId) {
        return this.recipients.find((r) => r.getRecipientId().equals(userId));
    }
    /**
     * Checks if the given user is the sender of this message.
     */
    isSender(userId) {
        return this.senderId.equals(userId);
    }
    /**
     * Checks if the given user is a recipient of this message.
     */
    isRecipient(userId) {
        return this.recipients.some((r) => r.getRecipientId().equals(userId));
    }
    /**
     * Checks if the given user has access to view this message
     * (either as sender or recipient).
     */
    isAccessibleBy(userId) {
        return this.isSender(userId) || this.isRecipient(userId);
    }
    /**
     * Returns the count of recipients.
     */
    recipientCount() {
        return this.recipients.length;
    }
    equals(other) {
        return this.id.equals(other.id);
    }
}
exports.Message = Message;
//# sourceMappingURL=message.js.map