import {
  Controller, Get, Post, Delete, Param, HttpCode, HttpStatus,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { PinMessageUseCase } from '../../application/pinned/use-cases/pin-message.use-case';
import { UnpinMessageUseCase } from '../../application/pinned/use-cases/unpin-message.use-case';
import { ListPinnedMessagesUseCase } from '../../application/pinned/use-cases/list-pinned-messages.use-case';

@Controller('pinned')
@UseGuards(AuthGuard)
export class PinnedController {
  constructor(
    private readonly pinMessage: PinMessageUseCase,
    private readonly unpinMessage: UnpinMessageUseCase,
    private readonly listPinned: ListPinnedMessagesUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: { userId: string }) {
    const result = await this.listPinned.execute(user.userId);
    return { data: result };
  }

  @Post(':messageId')
  @HttpCode(HttpStatus.CREATED)
  async pin(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.pinMessage.execute(messageId, user.userId);
    return { data: { pinned: true } };
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unpin(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.unpinMessage.execute(messageId, user.userId);
  }
}
