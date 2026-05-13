import {
  Attachment,
  AttachmentRepository,
  FileId,
  MessageId,
} from '@mensajeria/domain';
import { PrismaService } from '../prisma.service';
import { AttachmentMapper } from '../mappers/attachment-mapper';

/**
 * PrismaAttachmentRepository — infrastructure adapter implementing
 * AttachmentRepository port.
 *
 * Uses PrismaService for database access and AttachmentMapper for
 * conversions between Prisma records and domain entities.
 */
export class PrismaAttachmentRepository implements AttachmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(attachment: Attachment): Promise<void> {
    const data = AttachmentMapper.toPrisma(attachment);

    await this.prisma.attachment.create({ data });
  }

  async findById(id: FileId): Promise<Attachment | null> {
    const row = await this.prisma.attachment.findUnique({
      where: { id: id.get() },
    });

    if (!row) return null;

    return AttachmentMapper.toDomain(row);
  }

  async findByMessageId(messageId: MessageId): Promise<Attachment[]> {
    const rows = await this.prisma.attachment.findMany({
      where: { messageId: messageId.get() },
    });

    return rows.map(AttachmentMapper.toDomain);
  }

  async delete(id: FileId): Promise<void> {
    await this.prisma.attachment.deleteMany({
      where: { id: id.get() },
    });
  }
}
