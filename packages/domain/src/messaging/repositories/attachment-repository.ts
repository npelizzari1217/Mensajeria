import { Attachment } from '../entities/attachment';
import { FileId } from '../../shared/value-objects/file-id';
import { MessageId } from '../../shared/value-objects/message-id';

/**
 * AttachmentRepository port.
 *
 * Defines the contract for persisting and retrieving Attachment entities.
 * Implementation belongs in infrastructure/ (e.g., PrismaAttachmentRepository).
 */
export interface AttachmentRepository {
  /**
   * Persists an attachment (create or update).
   */
  save(attachment: Attachment): Promise<void>;

  /**
   * Finds an attachment by its FileId.
   * Returns null if not found.
   */
  findById(id: FileId): Promise<Attachment | null>;

  /**
   * Finds all attachments for a given message.
   * Returns an empty array if the message has no attachments.
   */
  findByMessageId(messageId: MessageId): Promise<Attachment[]>;

  /**
   * Deletes an attachment by its FileId.
   * No-op if the attachment does not exist (idempotent delete).
   */
  delete(id: FileId): Promise<void>;
}
