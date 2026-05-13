/**
 * UploadAttachmentDTO — input data for uploading a file attachment.
 *
 * The raw file buffer is passed separately to the use case.
 */
export interface UploadAttachmentDTO {
  /** ID of the message the attachment belongs to */
  messageId: string;

  /** Original filename from the upload */
  filename: string;

  /** MIME type (e.g. image/jpeg, application/pdf) */
  mimeType: string;

  /** File size in bytes */
  size: number;
}
