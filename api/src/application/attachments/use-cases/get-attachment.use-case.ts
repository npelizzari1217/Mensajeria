import {
  FileId,
  UserId,
  EmpresaId,
  MessageRepository,
  AttachmentRepository,
  UnauthorizedMessageAccessError,
  NotFoundError,
  Result,
  ok,
  err,
  DomainError,
} from '@mensajeria/domain';
import { AttachmentResponse } from '../dtos/attachment-response.dto';

/**
 * GetAttachmentUseCase.
 *
 * Returns attachment metadata only if the requesting user is either
 * the sender or a recipient of the parent message.
 */
export class GetAttachmentUseCase {
  constructor(
    private readonly attachmentRepo: AttachmentRepository,
    private readonly messageRepo: MessageRepository,
  ) {}

  async execute(
    attachmentId: string,
    userId: string,
    empresaId: EmpresaId,
  ): Promise<Result<AttachmentResponse, DomainError>> {
    // 1. Validate attachmentId
    const fileIdResult = FileId.createFrom(attachmentId);
    if (fileIdResult.isErr()) {
      return err(fileIdResult.unwrapErr()) as Result<AttachmentResponse, DomainError>;
    }
    const fileId = fileIdResult.unwrap();

    // 2. Validate userId
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) {
      return err(uidResult.unwrapErr()) as Result<AttachmentResponse, DomainError>;
    }
    const uid = uidResult.unwrap();

    // 3. Find attachment
    const attachment = await this.attachmentRepo.findById(fileId);
    if (!attachment) {
      return err(new NotFoundError('Attachment', attachmentId));
    }

    // 4. Find parent message to verify access
    const msgResult = await this.messageRepo.findById(
      attachment.getMessageId(),
      empresaId,
    );
    if (msgResult.isErr()) {
      return err(new NotFoundError('Message', attachment.getMessageId().get()));
    }
    const message = msgResult.unwrap();

    // 5. Verify access: sender or recipient
    if (!message.isAccessibleBy(uid)) {
      return err(
        new UnauthorizedMessageAccessError(userId, attachment.getMessageId().get()),
      );
    }

    // 6. Return response
    return ok({
      id: attachment.getId().get(),
      filename: attachment.getFilename(),
      mimeType: attachment.getMimeType(),
      size: attachment.getSize(),
      url: '', // URL construction belongs in the controller layer (PR 3)
      messageId: attachment.getMessageId().get(),
      uploadedAt: attachment.getUploadedAt().toISOString(),
    });
  }
}
