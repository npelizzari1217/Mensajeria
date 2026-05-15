import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
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
import { SendMessageRequest } from './dto/send-message.request';
import { PaginationQuery } from './dto/pagination.query';
import { SearchQueryDTO } from './dto/search-query.dto';

/**
 * MessagingController — REST endpoints for messaging.
 *
 * All endpoints are protected by AuthGuard.
 * Uses CurrentUser decorator to extract authenticated user identity.
 * Returns standard { data: ... } envelope via ResponseInterceptor.
 */
@Controller('messages')
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getInboxUseCase: GetInboxUseCase,
    private readonly getSentUseCase: GetSentUseCase,
    private readonly getMessageUseCase: GetMessageUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly replyToMessageUseCase: ReplyToMessageUseCase,
    private readonly getThreadUseCase: GetThreadUseCase,
    private readonly searchMessagesUseCase: SearchMessagesUseCase,
    private readonly forwardMessageUseCase: ForwardMessageUseCase,
    private readonly exportThreadUseCase: ExportThreadUseCase,
  ) {}

  // ── Send Message ────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async send(
    @Body() body: SendMessageRequest,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const result = await this.sendMessageUseCase.execute({
      senderId: user.userId,
      recipientIds: body.recipientIds,
      subject: body.subject,
      body: body.body,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── List Inbox ──────────────────────────────────────────────────

  @Get('inbox')
  @HttpCode(HttpStatus.OK)
  async inbox(
    @Query() query: PaginationQuery,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const pageSize = parseInt(query.pageSize ?? '20', 10);

    const result = await this.getInboxUseCase.execute({
      userId: user.userId,
      filter: query.status as 'unread' | 'read' | undefined,
      page,
      pageSize,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return result.unwrap(); // Already has { data, total, page, pageSize }
  }

  // ── List Sent ───────────────────────────────────────────────────

  @Get('sent')
  @HttpCode(HttpStatus.OK)
  async sent(
    @Query() query: PaginationQuery,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const pageSize = parseInt(query.pageSize ?? '20', 10);

    const result = await this.getSentUseCase.execute({
      userId: user.userId,
      page,
      pageSize,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return result.unwrap();
  }

  // ── Get Message Detail ──────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const result = await this.getMessageUseCase.execute(id, user.userId);

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── Mark as Read ────────────────────────────────────────────────

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const result = await this.markAsReadUseCase.execute(id, user.userId);

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── Reply to Message ────────────────────────────────────────────

  @Post(':id/reply')
  @HttpCode(HttpStatus.CREATED)
  async reply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { body: string },
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const result = await this.replyToMessageUseCase.execute({
      senderId: user.userId,
      parentMessageId: id,
      body: body.body,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── Export Thread ────────────────────────────────────────────────

  @Get(':id/thread/export')
  @HttpCode(HttpStatus.OK)
  async exportThread(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
    @Query('format') format?: string,
  ) {
    const result = await this.exportThreadUseCase.execute(
      id,
      user.userId,
      format ?? 'json',
    );

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── Forward Message ──────────────────────────────────────────────

  @Post(':id/forward')
  @HttpCode(HttpStatus.CREATED)
  async forward(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { recipientIds: string[]; comment?: string },
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const result = await this.forwardMessageUseCase.execute({
      senderId: user.userId,
      originalMessageId: id,
      recipientIds: body.recipientIds,
      comment: body.comment,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── Search Messages ─────────────────────────────────────────────

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async search(
    @Query() query: SearchQueryDTO,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const pageSize = parseInt(query.pageSize ?? '20', 10);

    const result = await this.searchMessagesUseCase.execute({
      userId: user.userId,
      query: query.q,
      page,
      pageSize,
    });

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return result.unwrap();
  }

  // ── Get Thread ──────────────────────────────────────────────────

  @Get(':id/thread')
  @HttpCode(HttpStatus.OK)
  async thread(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    const result = await this.getThreadUseCase.execute(id, user.userId);

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }
}
