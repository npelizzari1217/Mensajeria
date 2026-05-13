/**
 * SendMessageDTO — input for SendMessageUseCase.
 */
export interface SendMessageDTO {
  senderId: string;
  recipientIds: string[];
  subject: string;
  body: string;
}
