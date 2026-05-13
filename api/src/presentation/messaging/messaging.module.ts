import { Module } from '@nestjs/common';
import { MessagingController } from './messaging.controller';
import { SendMessageUseCase } from '../../application/messaging/use-cases/send-message.use-case';
import { GetInboxUseCase } from '../../application/messaging/use-cases/get-inbox.use-case';
import { GetSentUseCase } from '../../application/messaging/use-cases/get-sent.use-case';
import { GetMessageUseCase } from '../../application/messaging/use-cases/get-message.use-case';
import { MarkAsReadUseCase } from '../../application/messaging/use-cases/mark-as-read.use-case';
import { ReplyToMessageUseCase } from '../../application/messaging/use-cases/reply-to-message.use-case';
import { GetThreadUseCase } from '../../application/messaging/use-cases/get-thread.use-case';
import { PrismaMessageRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-message.repository';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { JwtAuthPort } from '../../infrastructure/auth/jwt-auth-port';

@Module({
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
      useFactory: (userRepo, msgRepo) => new GetMessageUseCase(userRepo, msgRepo),
      inject: ['UserRepository', 'MessageRepository'],
    },
    {
      provide: MarkAsReadUseCase,
      useFactory: (msgRepo, eventBus) => new MarkAsReadUseCase(msgRepo, eventBus),
      inject: ['MessageRepository', 'EventBus'],
    },
    {
      provide: ReplyToMessageUseCase,
      useFactory: (userRepo, msgRepo) => new ReplyToMessageUseCase(userRepo, msgRepo),
      inject: ['UserRepository', 'MessageRepository'],
    },
    {
      provide: GetThreadUseCase,
      useFactory: (userRepo, msgRepo) => new GetThreadUseCase(userRepo, msgRepo),
      inject: ['UserRepository', 'MessageRepository'],
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

    // ── Infrastructure: Auth ──────────────────────────────────────
    AuthGuard,
    JwtAuthPort,
    {
      provide: 'AuthPort',
      useExisting: JwtAuthPort,
    },
  ],
  exports: [
    'MessageRepository',
  ],
})
export class MessagingModule {}
