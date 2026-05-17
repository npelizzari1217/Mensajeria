"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForwardedContent = void 0;
/**
 * ForwardedContent Value Object.
 *
 * Encapsulates the original message content being forwarded.
 * Used to quote the original message in the new forwarded message body.
 */
class ForwardedContent {
    originalMessageId;
    originalSenderName;
    originalSubject;
    originalBody;
    comment;
    constructor(originalMessageId, originalSenderName, originalSubject, originalBody, comment) {
        this.originalMessageId = originalMessageId;
        this.originalSenderName = originalSenderName;
        this.originalSubject = originalSubject;
        this.originalBody = originalBody;
        this.comment = comment;
    }
    static create(props) {
        return new ForwardedContent(props.originalMessageId, props.originalSenderName, props.originalSubject, props.originalBody, props.comment ?? null);
    }
    getOriginalMessageId() {
        return this.originalMessageId;
    }
    getOriginalSenderName() {
        return this.originalSenderName;
    }
    getOriginalSubject() {
        return this.originalSubject;
    }
    getOriginalBody() {
        return this.originalBody;
    }
    getComment() {
        return this.comment;
    }
    /**
     * Builds the forwarded message body with quoted original content.
     */
    buildForwardBody() {
        const parts = [];
        if (this.comment) {
            parts.push(this.comment);
            parts.push('');
        }
        parts.push(`---------- Mensaje reenviado ----------`);
        parts.push(`De: ${this.originalSenderName}`);
        parts.push(`Asunto: ${this.originalSubject}`);
        parts.push('');
        parts.push(this.originalBody);
        return parts.join('\n');
    }
    equals(other) {
        return this.originalMessageId === other.originalMessageId;
    }
}
exports.ForwardedContent = ForwardedContent;
//# sourceMappingURL=forwarded-content.js.map