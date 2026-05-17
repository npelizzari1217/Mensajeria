import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { UploadAttachmentUseCase } from '../../application/attachments/use-cases/upload-attachment.use-case';
import { GetAttachmentUseCase } from '../../application/attachments/use-cases/get-attachment.use-case';
import { DeleteAttachmentUseCase } from '../../application/attachments/use-cases/delete-attachment.use-case';
import { PrismaAttachmentRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-attachment.repository';
import { LocalFileStorage } from '../../infrastructure/storage/local-file-storage';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';

/**
 * AttachmentsModule — wires the file attachment feature.
 *
 * Provides:
 * - AttachmentsController with three use cases
 * - LocalFileStorage adapter (disk-based IFileStorage)
 * - PrismaAttachmentRepository (DB persistence)
 */
@Module({
  imports: [AuthModule, MessagingModule],
  controllers: [AttachmentsController],
  providers: [
    // ── Use Cases ─────────────────────────────────────────────────
    {
      provide: UploadAttachmentUseCase,
      useFactory: (
        msgRepo: import('@mensajeria/domain').MessageRepository,
        fileStorage: import('@mensajeria/domain').IFileStorage,
        attRepo: import('@mensajeria/domain').AttachmentRepository,
      ) => new UploadAttachmentUseCase(msgRepo, fileStorage, attRepo),
      inject: ['MessageRepository', 'FileStorage', 'AttachmentRepository'],
    },
    {
      provide: GetAttachmentUseCase,
      useFactory: (
        attRepo: import('@mensajeria/domain').AttachmentRepository,
        msgRepo: import('@mensajeria/domain').MessageRepository,
      ) => new GetAttachmentUseCase(attRepo, msgRepo),
      inject: ['AttachmentRepository', 'MessageRepository'],
    },
    {
      provide: DeleteAttachmentUseCase,
      useFactory: (
        attRepo: import('@mensajeria/domain').AttachmentRepository,
        msgRepo: import('@mensajeria/domain').MessageRepository,
        fileStorage: import('@mensajeria/domain').IFileStorage,
      ) => new DeleteAttachmentUseCase(attRepo, msgRepo, fileStorage),
      inject: ['AttachmentRepository', 'MessageRepository', 'FileStorage'],
    },

    // ── Infrastructure: Storage ───────────────────────────────────
    {
      provide: LocalFileStorage,
      useFactory: () => new LocalFileStorage(),
    },
    {
      provide: 'FileStorage',
      useExisting: LocalFileStorage,
    },

    // ── Infrastructure: Persistence ───────────────────────────────
    {
      provide: PrismaAttachmentRepository,
      useFactory: (prisma: PrismaService) => new PrismaAttachmentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'AttachmentRepository',
      useExisting: PrismaAttachmentRepository,
    },
  ],
})
export class AttachmentsModule {}
