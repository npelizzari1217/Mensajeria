import {
  MessageId,
  UserId,
  EmpresaId,
  MessageRepository,
  IFileStorage,
  Attachment,
  AttachmentRepository,
  UnauthorizedMessageAccessError,
  NotFoundError,
  Result,
  ok,
  err,
  DomainError,
  StorageError,
  ValidationError,
} from '@mensajeria/domain';
import { UploadAttachmentDTO } from '../dtos/upload-attachment.dto';
import { AttachmentResponse } from '../dtos/attachment-response.dto';

/**
 * Allowed MIME types for file uploads.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/** Maximum file size in bytes (10 MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * UploadAttachmentUseCase.
 *
 * Handles file upload: validates the user is the message sender,
 * checks file type and size, delegates to IFileStorage for persistence,
 * and stores the attachment record in the database.
 */
export class UploadAttachmentUseCase {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly fileStorage: IFileStorage,
    private readonly attachmentRepo: AttachmentRepository,
  ) {}

  async execute(
    dto: UploadAttachmentDTO,
    buffer: Buffer,
    userId: string,
    empresaId: EmpresaId,
  ): Promise<Result<AttachmentResponse, DomainError>> {
    // 1. Validate file size
    if (dto.size > MAX_FILE_SIZE) {
      return err(new ValidationError('File size exceeds the 10 MB limit'));
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      return err(new ValidationError(`File type '${dto.mimeType}' is not allowed`));
    }

    // 3. Validate messageId
    const messageIdResult = MessageId.create(dto.messageId);
    if (messageIdResult.isErr()) {
      return err(messageIdResult.unwrapErr()) as Result<AttachmentResponse, DomainError>;
    }
    const messageId = messageIdResult.unwrap();

    // 4. Validate userId
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) {
      return err(uidResult.unwrapErr()) as Result<AttachmentResponse, DomainError>;
    }
    const uid = uidResult.unwrap();

    // 5. Verify message exists
    const msgResult = await this.messageRepo.findById(messageId, empresaId);
    if (msgResult.isErr()) {
      return err(new NotFoundError('Message', dto.messageId));
    }
    const message = msgResult.unwrap();

    // 6. Verify user is the sender (only sender can attach files)
    if (!message.isSender(uid)) {
      return err(
        new UnauthorizedMessageAccessError(userId, dto.messageId),
      );
    }

    // 7. Upload file to storage
    let fileId;
    try {
      fileId = await this.fileStorage.upload(
        dto.filename,
        buffer,
        dto.mimeType,
      );
    } catch (raw) {
      const cause =
        raw instanceof Error ? raw : new Error(String(raw));
      return err(new StorageError('Failed to upload file', cause));
    }

    // 8. Create domain entity with the FileId from storage
    const storagePath = this.fileStorage.getPath(fileId);

    const attachmentResult = Attachment.create(
      dto.filename,
      dto.mimeType,
      dto.size,
      messageId,
      fileId, // use pre-generated FileId from storage
    );
    if (attachmentResult.isErr()) {
      // File was uploaded — attempt cleanup
      await this.fileStorage.delete(fileId).catch(() => {});
      return err(attachmentResult.unwrapErr()) as Result<AttachmentResponse, DomainError>;
    }
    const attachment = attachmentResult.unwrap();

    // 9. Persist attachment record
    try {
      await this.attachmentRepo.save(attachment);
    } catch (raw) {
      // DB failed — clean up the stored file
      await this.fileStorage.delete(fileId).catch(() => {});
      const cause =
        raw instanceof Error ? raw : new Error(String(raw));
      return err(new StorageError('Failed to save attachment record', cause));
    }

    // 10. Return response
    return ok({
      id: attachment.getId().get(),
      filename: attachment.getFilename(),
      mimeType: attachment.getMimeType(),
      size: attachment.getSize(),
      url: this.fileStorage.getUrl(fileId),
      messageId: attachment.getMessageId().get(),
      uploadedAt: attachment.getUploadedAt().toISOString(),
    });
  }
}
