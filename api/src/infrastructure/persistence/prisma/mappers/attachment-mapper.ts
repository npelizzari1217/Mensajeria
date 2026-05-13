import {
  Attachment,
  FileId,
  MessageId,
} from '@mensajeria/domain';
import { Attachment as PrismaAttachment } from '@prisma/client';

/**
 * AttachmentMapper — converts between Prisma Attachment model
 * and domain Attachment entity.
 *
 * Stateless — call static methods directly.
 * toDomain:  Prisma → Domain (uses reconstruct for trusted DB data)
 * toPrisma:  Domain → Prisma create/update input
 */
export class AttachmentMapper {
  /**
   * Converts a Prisma Attachment record to a domain Attachment entity.
   */
  static toDomain(row: PrismaAttachment): Attachment {
    return Attachment.reconstruct({
      id: FileId.reconstruct(row.id),
      filename: row.filename,
      mimeType: row.mimeType,
      size: row.size,
      messageId: MessageId.reconstruct(row.messageId),
      uploadedAt: row.uploadedAt,
      storagePath: row.storagePath,
    });
  }

  /**
   * Converts a domain Attachment to Prisma-compatible create input.
   *
   * The `storagePath` comes from the entity — set during upload
   * via the IFileStorage adapter's convention.
   */
  static toPrisma(
    attachment: Attachment,
  ): {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    storagePath: string;
    messageId: string;
    uploadedAt: Date;
  } {
    return {
      id: attachment.getId().get(),
      filename: attachment.getFilename(),
      mimeType: attachment.getMimeType(),
      size: attachment.getSize(),
      storagePath: attachment.getStoragePath() ?? '',
      messageId: attachment.getMessageId().get(),
      uploadedAt: attachment.getUploadedAt(),
    };
  }
}
