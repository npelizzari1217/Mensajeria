/**
 * PinnedMessageResponse — a pinned message entry returned from queries.
 */
export interface PinnedMessageResponse {
  id: string;
  messageId: string;
  senderId: string;
  senderName: string;
  subject: string;
  body: string;
  pinnedAt: string;
}
