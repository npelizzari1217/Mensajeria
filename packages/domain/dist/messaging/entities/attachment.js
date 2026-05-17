"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attachment = void 0;
const file_id_1 = require("../../shared/value-objects/file-id");
const result_1 = require("../../shared/result");
/**
 * Attachment entity.
 *
 * Represents a file attached to a message. This is a minimal entity —
 * reconstruct-only, with no business behavior methods. Domain invariants
 * are enforced at creation via the factory.
 *
 * Belongs to the Message aggregate root (accessed only through the
 * parent Message's context).
 */
class Attachment {
    id;
    filename;
    mimeType;
    size;
    messageId;
    uploadedAt;
    storagePath;
    constructor(id, filename, mimeType, size, messageId, uploadedAt, storagePath) {
        this.id = id;
        this.filename = filename;
        this.mimeType = mimeType;
        this.size = size;
        this.messageId = messageId;
        this.uploadedAt = uploadedAt;
        this.storagePath = storagePath;
    }
    /**
     * Factory for NEW attachments.
     * Generates a new FileId and sets uploadedAt to now.
     * Optionally accepts a pre-generated FileId for the upload flow
     * (where the storage adapter owns identity generation).
     */
    static create(filename, mimeType, size, messageId, fileId) {
        if (!filename || filename.trim().length === 0) {
            return (0, result_1.err)(new Error('Filename cannot be empty'));
        }
        if (size <= 0) {
            return (0, result_1.err)(new Error('Size must be greater than 0'));
        }
        return (0, result_1.ok)(new Attachment(fileId ?? file_id_1.FileId.create(), filename.trim(), mimeType, size, messageId, new Date()));
    }
    /**
     * Reconstruction from persistence — skips runtime validation.
     * Use ONLY when restoring from a trusted source (DB).
     */
    static reconstruct(props) {
        return new Attachment(props.id, props.filename, props.mimeType, props.size, props.messageId, props.uploadedAt, props.storagePath);
    }
    // --- Identity ---
    getId() {
        return this.id;
    }
    getFilename() {
        return this.filename;
    }
    getMimeType() {
        return this.mimeType;
    }
    getSize() {
        return this.size;
    }
    getMessageId() {
        return this.messageId;
    }
    getUploadedAt() {
        return this.uploadedAt;
    }
    getStoragePath() {
        return this.storagePath;
    }
    equals(other) {
        return this.id.equals(other.id);
    }
}
exports.Attachment = Attachment;
//# sourceMappingURL=attachment.js.map