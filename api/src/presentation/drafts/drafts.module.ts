import { Module } from '@nestjs/common';
import { DraftsController } from './drafts.controller';
import { SaveDraftUseCase } from '../../application/drafts/use-cases/save-draft.use-case';
import { UpdateDraftUseCase } from '../../application/drafts/use-cases/update-draft.use-case';
import { GetDraftUseCase } from '../../application/drafts/use-cases/get-draft.use-case';
import { ListDraftsUseCase } from '../../application/drafts/use-cases/list-drafts.use-case';
import { SendDraftUseCase } from '../../application/drafts/use-cases/send-draft.use-case';
import { DeleteDraftUseCase } from '../../application/drafts/use-cases/delete-draft.use-case';
import { PrismaDraftRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-draft.repository';
import { DraftMapper } from '../../infrastructure/persistence/prisma/mappers/draft-mapper';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  controllers: [DraftsController],
  providers: [
    SaveDraftUseCase,
    UpdateDraftUseCase,
    GetDraftUseCase,
    ListDraftsUseCase,
    SendDraftUseCase,
    DeleteDraftUseCase,
    DraftMapper,
    {
      provide: 'DraftRepository',
      useFactory: (prisma: PrismaService, mapper: DraftMapper) =>
        new PrismaDraftRepository(prisma, mapper),
      inject: [PrismaService, DraftMapper],
    },
  ],
})
export class DraftsModule {}
