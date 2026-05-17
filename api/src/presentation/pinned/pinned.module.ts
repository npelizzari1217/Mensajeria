import { Module } from '@nestjs/common';
import { PinnedController } from './pinned.controller';
import { PinMessageUseCase } from '../../application/pinned/use-cases/pin-message.use-case';
import { UnpinMessageUseCase } from '../../application/pinned/use-cases/unpin-message.use-case';
import { ListPinnedMessagesUseCase } from '../../application/pinned/use-cases/list-pinned-messages.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PinnedController],
  providers: [
    PinMessageUseCase,
    UnpinMessageUseCase,
    ListPinnedMessagesUseCase,
  ],
})
export class PinnedModule {}
