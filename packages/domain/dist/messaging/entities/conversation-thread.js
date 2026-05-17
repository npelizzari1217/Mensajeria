"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationThread = void 0;
const thread_id_1 = require("../value-objects/thread-id");
const timestamp_1 = require("../../shared/value-objects/timestamp");
/**
 * ConversationThread entity.
 *
 * Groups related messages (replies) into a conversation.
 * A thread is created when the first message in a conversation is sent,
 * or an existing thread can be referenced by parentMessageId chains.
 */
class ConversationThread {
    id;
    subject;
    messageCount;
    createdAt;
    updatedAt;
    constructor(id, subject, messageCount, createdAt, updatedAt) {
        this.id = id;
        this.subject = subject;
        this.messageCount = messageCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(subject) {
        return new ConversationThread(thread_id_1.ThreadId.reconstruct(crypto.randomUUID()), subject, 0, timestamp_1.Timestamp.now(), timestamp_1.Timestamp.now());
    }
    static reconstruct(props) {
        return new ConversationThread(props.id, props.subject, props.messageCount, props.createdAt, props.updatedAt);
    }
    // --- Identity ---
    getId() {
        return this.id;
    }
    getSubject() {
        return this.subject;
    }
    getMessageCount() {
        return this.messageCount;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getUpdatedAt() {
        return this.updatedAt;
    }
    // --- Behavior ---
    /**
     * Increments message count when a new message is added to this thread.
     */
    addMessage() {
        this.messageCount += 1;
        this.updatedAt = timestamp_1.Timestamp.now();
    }
    /**
     * Updates the thread subject.
     */
    changeSubject(subject) {
        this.subject = subject;
        this.updatedAt = timestamp_1.Timestamp.now();
    }
    equals(other) {
        return this.id.equals(other.id);
    }
}
exports.ConversationThread = ConversationThread;
//# sourceMappingURL=conversation-thread.js.map