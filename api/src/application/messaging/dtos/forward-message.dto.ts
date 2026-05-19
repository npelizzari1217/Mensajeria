/**
 * ForwardMessageDTO — input for ForwardMessageUseCase.
 */
export interface ForwardMessageDTO {
  senderId: string;
  originalMessageId: string;
  recipientEmails: string[];
  comment?: string;
}
