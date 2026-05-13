/**
 * MessageRecipientResponse — recipient info within a message response.
 */
export interface MessageRecipientResponse {
  recipientId: string;
  recipientName: string;
  status: string;
  readAt: string | null;
}

/**
 * MessageResponse — single message returned from queries.
 *
 * Contains the full detail for a message: sender info, subject, body,
 * recipient list with their statuses, and timestamps.
 */
export interface MessageResponse {
  id: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  parentMessageId: string | null;
  sentAt: string;
  createdAt: string;
  recipients: MessageRecipientResponse[];
}
