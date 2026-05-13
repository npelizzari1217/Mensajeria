import {
  FileId,
  UserId,
  MessageRepository,
  AttachmentRepository,
  IFileStorage,
  UnauthorizedMessageAccessError,
  NotFoundError,
  Result,
  ok,
  err,
  DomainError,
  StorageError,
} from '@mensajeria/domain';

/**
 * DeleteAttachmentUseCase.
 *
 * Deletes an attachment — both the file from storage and the DB record.
 * Only the sender of the parent message is allowed to delete.
 */
export class DeleteAttachmentUseCase {
  constructor(
    private readonly attachmentRepo: AttachmentRepository,
    private readonly messageRepo: MessageRepository,
    private readonly fileStorage: IFileStorage,
  ) {}

  async execute(
    attachmentId: string,
    userId: string,
  ): Promise<Result<void, DomainError>> {
    // 1. Validate attachmentId
    const fileIdResult = FileId.createFrom(attachmentId);
    if (fileIdResult.isErr()) {
      return err(fileIdResult.unwrapErr());
    }
    const fileId = fileIdResult.unwrap();

    // 2. Validate userId
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) {
      return err(uidResult.unwrapErr());
    }
    const uid = uidResult.unwrap();

    // 3. Find attachment
    const attachment = await this.attachmentRepo.findById(fileId);
    if (!attachment) {
      return err(new NotFoundError('Attachment', attachmentId));
    }

    // 4. Find parent message
    const msgResult = await this.messageRepo.findById(
      attachment.getMessageId(),
    );
    if (msgResult.isErr()) {
      return err(new NotFoundError('Message', attachment.getMessageId().get()));
    }
    const message = msgResult.unwrap();

    // 5. Verify user is the sender (only sender can delete)
    if (!message.isSender(uid)) {
      return err(
        new UnauthorizedMessageAccessError(userId, attachment.getMessageId().get()),
      );
    }

    // 6. Delete file from storage
    try {
      await this.fileStorage.delete(fileId);
    } catch (raw) {
      const cause =
        raw instanceof Error ? raw : new Error(String(raw));
      return err(new StorageError('Failed to delete file from storage', cause));
    }

    // 7. Delete DB record
    try {
      await this.attachmentRepo.delete(fileId);
    } catch (raw) {
      const cause =
        raw instanceof Error ? raw : new Error(String(raw));
      return err(new StorageError('Failed to delete attachment record', cause));
    }

    return ok(undefined);
  }
}
