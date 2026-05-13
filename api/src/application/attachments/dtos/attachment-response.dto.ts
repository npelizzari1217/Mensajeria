/**
 * AttachmentResponse — attachment data returned from queries.
 */
export interface AttachmentResponse {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  messageId: string;
  uploadedAt: string;
}
