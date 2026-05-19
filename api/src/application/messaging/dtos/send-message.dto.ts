/**
 * SendMessageDTO — input for SendMessageUseCase.
 */
export interface SendMessageDTO {
  senderId: string;
  recipientEmails: string[];
  subject: string;
  body: string;
}
