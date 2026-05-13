import { FileId } from '../../shared/value-objects/file-id';
import { MessageId } from '../../shared/value-objects/message-id';
import { Result, ok, err } from '../../shared/result';

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
export class Attachment {
  private constructor(
    private readonly id: FileId,
    private readonly filename: string,
    private readonly mimeType: string,
    private readonly size: number,
    private readonly messageId: MessageId,
    private readonly uploadedAt: Date,
    private readonly storagePath?: string,
  ) {}

  /**
   * Factory for NEW attachments.
   * Generates a new FileId and sets uploadedAt to now.
   * Optionally accepts a pre-generated FileId for the upload flow
   * (where the storage adapter owns identity generation).
   */
  static create(
    filename: string,
    mimeType: string,
    size: number,
    messageId: MessageId,
    fileId?: FileId,
  ): Result<Attachment, Error> {
    if (!filename || filename.trim().length === 0) {
      return err(new Error('Filename cannot be empty'));
    }
    if (size <= 0) {
      return err(new Error('Size must be greater than 0'));
    }

    return ok(
      new Attachment(
        fileId ?? FileId.create(),
        filename.trim(),
        mimeType,
        size,
        messageId,
        new Date(),
      ),
    );
  }

  /**
   * Reconstruction from persistence — skips runtime validation.
   * Use ONLY when restoring from a trusted source (DB).
   */
  static reconstruct(props: AttachmentProps): Attachment {
    return new Attachment(
      props.id,
      props.filename,
      props.mimeType,
      props.size,
      props.messageId,
      props.uploadedAt,
      props.storagePath,
    );
  }

  // --- Identity ---

  getId(): FileId {
    return this.id;
  }

  getFilename(): string {
    return this.filename;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getSize(): number {
    return this.size;
  }

  getMessageId(): MessageId {
    return this.messageId;
  }

  getUploadedAt(): Date {
    return this.uploadedAt;
  }

  getStoragePath(): string | undefined {
    return this.storagePath;
  }

  equals(other: Attachment): boolean {
    return this.id.equals(other.id);
  }
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
