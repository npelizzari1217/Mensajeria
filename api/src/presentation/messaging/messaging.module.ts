import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { SendMessageUseCase } from '../../application/messaging/use-cases/send-message.use-case';
import { GetInboxUseCase } from '../../application/messaging/use-cases/get-inbox.use-case';
import { GetSentUseCase } from '../../application/messaging/use-cases/get-sent.use-case';
import { GetMessageUseCase } from '../../application/messaging/use-cases/get-message.use-case';
import { MarkAsReadUseCase } from '../../application/messaging/use-cases/mark-as-read.use-case';
import { ReplyToMessageUseCase } from '../../application/messaging/use-cases/reply-to-message.use-case';
import { GetThreadUseCase } from '../../application/messaging/use-cases/get-thread.use-case';
import { SearchMessagesUseCase } from '../../application/messaging/use-cases/search-messages.use-case';
import { ForwardMessageUseCase } from '../../application/messaging/use-cases/forward-message.use-case';
import { ExportThreadUseCase } from '../../application/messaging/use-cases/export-thread.use-case';
import { PrismaMessageRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-message.repository';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MessagingController],
  providers: [
    // ── Use Cases ─────────────────────────────────────────────────
    {
      provide: SendMessageUseCase,
      useFactory: (userRepo, msgRepo, eventBus) => new SendMessageUseCase(userRepo, msgRepo, eventBus),
      inject: ['UserRepository', 'MessageRepository', 'EventBus'],
    },
    {
      provide: GetInboxUseCase,
      useFactory: (msgRepo) => new GetInboxUseCase(msgRepo),
      inject: ['MessageRepository'],
    },
    {
      provide: GetSentUseCase,
      useFactory: (msgRepo) => new GetSentUseCase(msgRepo),
      inject: ['MessageRepository'],
    },
    {
      provide: GetMessageUseCase,
      useFactory: (msgRepo) => new GetMessageUseCase(msgRepo),
      inject: ['MessageRepository'],
    },
    {
      provide: MarkAsReadUseCase,
      useFactory: (msgRepo, eventBus) => new MarkAsReadUseCase(msgRepo, eventBus),
      inject: ['MessageRepository', 'EventBus'],
    },
    {
      provide: ReplyToMessageUseCase,
      useFactory: (userRepo, msgRepo, eventBus) => new ReplyToMessageUseCase(userRepo, msgRepo, eventBus),
      inject: ['UserRepository', 'MessageRepository', 'EventBus'],
    },
    {
      provide: GetThreadUseCase,
      useFactory: (msgRepo) => new GetThreadUseCase(msgRepo),
      inject: ['MessageRepository'],
    },
    {
      provide: SearchMessagesUseCase,
      useFactory: (msgRepo, eventBus) => new SearchMessagesUseCase(msgRepo, eventBus),
      inject: ['MessageRepository', 'EventBus'],
    },
    {
      provide: ForwardMessageUseCase,
      useFactory: (userRepo, msgRepo, eventBus) => new ForwardMessageUseCase(userRepo, msgRepo, eventBus),
      inject: ['UserRepository', 'MessageRepository', 'EventBus'],
    },
    {
      provide: ExportThreadUseCase,
      useFactory: (msgRepo) => new ExportThreadUseCase(msgRepo),
      inject: ['MessageRepository'],
    },

    // ── Infrastructure: Persistence ───────────────────────────────
    {
      provide: PrismaMessageRepository,
      useFactory: (prisma) => new PrismaMessageRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: 'MessageRepository',
      useExisting: PrismaMessageRepository,
    },

    // ── WebSocket Gateway ─────────────────────────────────────────
    MessagingGateway,

  ],
  exports: [
    'MessageRepository',
    MessagingGateway,
    SendMessageUseCase,
    ForwardMessageUseCase,
  ],
})
export class MessagingModule {}
