/**
 * SendMessageRequest — HTTP request body for POST /v1/messages.
 */
export interface SendMessageRequest {
  recipientIds: string[];
  subject: string;
  body: string;
}
