/**
 * ReplyMessageDTO — input for ReplyToMessageUseCase.
 */
export interface ReplyMessageDTO {
  senderId: string;
  parentMessageId: string;
  body: string;
}
