import { FileId } from '../../shared/value-objects/file-id';
import { MessageId } from '../../shared/value-objects/message-id';
import { Result } from '../../shared/result';
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
export declare class Attachment {
    private readonly id;
    private readonly filename;
    private readonly mimeType;
    private readonly size;
    private readonly messageId;
    private readonly uploadedAt;
    private readonly storagePath?;
    private constructor();
    /**
     * Factory for NEW attachments.
     * Generates a new FileId and sets uploadedAt to now.
     * Optionally accepts a pre-generated FileId for the upload flow
     * (where the storage adapter owns identity generation).
     */
    static create(filename: string, mimeType: string, size: number, messageId: MessageId, fileId?: FileId): Result<Attachment, Error>;
    /**
     * Reconstruction from persistence — skips runtime validation.
     * Use ONLY when restoring from a trusted source (DB).
     */
    static reconstruct(props: AttachmentProps): Attachment;
    getId(): FileId;
    getFilename(): string;
    getMimeType(): string;
    getSize(): number;
    getMessageId(): MessageId;
    getUploadedAt(): Date;
    getStoragePath(): string | undefined;
    equals(other: Attachment): boolean;
}
export interface AttachmentProps {
    id: FileId;
    filename: string;
    mimeType: string;
    size: number;
    messageId: MessageId;
    uploadedAt: Date;
    /** Filesystem path for the stored file — set by infrastructure adapter */
    storagePath?: string;
}
//# sourceMappingURL=attachment.d.ts.map