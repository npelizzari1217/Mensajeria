/**
 * ForwardMessageDTO — input for ForwardMessageUseCase.
 */
export interface ForwardMessageDTO {
  senderId: string;
  originalMessageId: string;
  recipientIds: string[];
  comment?: string;
}
