/**
 * SendMessageRequest — HTTP request body for POST /v1/messages.
 */
export interface SendMessageRequest {
  recipientEmails: string[];
  subject: string;
  body: string;
}
