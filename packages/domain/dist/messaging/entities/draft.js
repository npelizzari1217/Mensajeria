"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Draft = void 0;
const timestamp_1 = require("../../shared/value-objects/timestamp");
const result_1 = require("../../shared/result");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Draft entity — a message that hasn't been sent yet.
 *
 * Users can save drafts before sending. Drafts are per-user and
 * can have recipients assigned or just subject/body while composing.
 */
class Draft {
    id;
    userId;
    subject;
    body;
    recipientIds;
    groupId;
    createdAt;
    updatedAt;
    constructor(id, userId, subject, body, recipientIds, groupId, createdAt, updatedAt) {
        this.id = id;
        this.userId = userId;
        this.subject = subject;
        this.body = body;
        this.recipientIds = recipientIds;
        this.groupId = groupId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    /**
     * Factory for NEW drafts.
     */
    static create(props) {
        if (!props.body || props.body.trim().length === 0) {
            return (0, result_1.err)(new Error('Draft body is required'));
        }
        const id = crypto_1.default.randomUUID();
        const now = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(new Draft(id, props.userId, props.subject ?? null, props.body.trim(), props.recipientIds ?? [], props.groupId ?? null, now, now));
    }
    /**
     * Reconstruction from persistence.
     */
    static reconstruct(props) {
        return new Draft(props.id, props.userId, props.subject, props.body, props.recipientIds, props.groupId, props.createdAt, props.updatedAt);
    }
    // --- Identity ---
    getId() {
        return this.id;
    }
    getUserId() {
        return this.userId;
    }
    getSubject() {
        return this.subject;
    }
    getBody() {
        return this.body;
    }
    getRecipientIds() {
        return [...this.recipientIds];
    }
    getGroupId() {
        return this.groupId;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getUpdatedAt() {
        return this.updatedAt;
    }
    // --- Behavior ---
    /**
     * Updates draft fields. Returns a new Draft with the merged values.
     * The original draft is not mutated (immutable).
     */
    update(props) {
        return new Draft(this.id, this.userId, props.subject !== undefined ? props.subject : this.subject, props.body !== undefined ? props.body : this.body, props.recipientIds !== undefined ? props.recipientIds : [...this.recipientIds], props.groupId !== undefined ? props.groupId : this.groupId, this.createdAt, timestamp_1.Timestamp.now());
    }
    /**
     * Returns true if this draft has all required fields to be sent.
     */
    canBeSent() {
        return this.body.trim().length > 0
            && (this.recipientIds.length > 0 || this.groupId !== null);
    }
    equals(other) {
        return this.id === other.id;
    }
}
exports.Draft = Draft;
//# sourceMappingURL=draft.js.map