import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileId } from '@mensajeria/domain';
import { AuthGuard } from '../../infrastructure/auth/guards/auth.guard';
import { CurrentUser } from '../../infrastructure/auth/decorators/current-user.decorator';
import { UploadAttachmentUseCase } from '../../application/attachments/use-cases/upload-attachment.use-case';
import { GetAttachmentUseCase } from '../../application/attachments/use-cases/get-attachment.use-case';
import { DeleteAttachmentUseCase } from '../../application/attachments/use-cases/delete-attachment.use-case';
import { LocalFileStorage } from '../../infrastructure/storage/local-file-storage';

/**
 * AttachmentsController — REST endpoints for file attachments.
 *
 * - POST /v1/messages/:messageId/attachments — upload (multipart/form-data, field: 'file')
 * - GET  /v1/attachments/:id — download file content
 * - DELETE /v1/attachments/:id — delete attachment
 *
 * All endpoints protected by AuthGuard. Upload uses multer via FileInterceptor.
 * Download streams file directly from LocalFileStorage with access control.
 */
@Controller()
@UseGuards(AuthGuard)
export class AttachmentsController {
  constructor(
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
    private readonly getAttachmentUseCase: GetAttachmentUseCase,
    private readonly deleteAttachmentUseCase: DeleteAttachmentUseCase,
    private readonly fileStorage: LocalFileStorage,
  ) {}

  // ── Upload ──────────────────────────────────────────────────────

  @Post('messages/:messageId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.uploadAttachmentUseCase.execute(
      {
        messageId,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      file.buffer,
      user.userId,
    );

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    return { data: result.unwrap() };
  }

  // ── Download ────────────────────────────────────────────────────

  @Get('attachments/:id')
  @HttpCode(HttpStatus.OK)
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
    @Res() res: Response,
  ) {
    // 1. Verify access and get attachment metadata
    const result = await this.getAttachmentUseCase.execute(id, user.userId);

    if (result.isErr()) {
      throw result.unwrapErr();
    }

    const attachment = result.unwrap();

    // 2. Resolve file path from storage
    const fileId = FileId.reconstruct(id);
    const dirPath = this.fileStorage.getPath(fileId);
    const filePath = path.join(dirPath, attachment.filename);

    // 3. Verify file exists on disk
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on storage');
    }

    // 4. Stream file with proper headers
    const stat = fs.statSync(filePath);

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.filename}"`,
    );
    res.setHeader('Content-Length', stat.size.toString());

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }

  // ── Delete ──────────────────────────────────────────────────────

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string; role: string },
  ): Promise<void> {
    const result = await this.deleteAttachmentUseCase.execute(id, user.userId);

    if (result.isErr()) {
      throw result.unwrapErr();
    }
  }
}
