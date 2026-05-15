import {
  DraftRepository, UserRepository, DraftNotFoundError,
  Message, UserId, Subject, MessageBody,
  MessageRepository, MessageSent, NotFoundError,
  EventBus, Result, ok, err,
} from '@mensajeria/domain';
import { Inject } from '@nestjs/common';
import { MessageResponse } from '../../messaging/dtos/message-response.dto';
import { SendMessageDTO } from '../../messaging/dtos/send-message.dto';
import { SendMessageUseCase } from '../../messaging/use-cases/send-message.use-case';

export class SendDraftUseCase {
  constructor(
    private readonly draftRepo: DraftRepository,
    private readonly sendMessage: SendMessageUseCase,
  ) {}

  async execute(draftId: string, userId: string): Promise<Result<MessageResponse, Error>> {
    // 1. Find the draft
    const findResult = await this.draftRepo.findById(draftId);
    if (findResult.isErr()) return err(findResult.unwrapErr());

    const draft = findResult.unwrap();
    if (!draft) return err(new DraftNotFoundError(draftId));

    // 2. Ownership check
    if (draft.getUserId().get() !== userId) {
      return err(new Error('Not authorized to send this draft'));
    }

    // 3. Validate draft can be sent
    if (!draft.canBeSent()) {
      return err(new Error('Draft must have at least one recipient or a group to be sent'));
    }

    // 4. Send via existing send message use case
    const sendDto: SendMessageDTO = {
      senderId: userId,
      recipientIds: [...draft.getRecipientIds()],
      subject: draft.getSubject() ?? '',
      body: draft.getBody(),
    };

    const sendResult = await this.sendMessage.execute(sendDto);
    if (sendResult.isErr()) return err(sendResult.unwrapErr());

    // 5. Delete the draft
    const deleteResult = await this.draftRepo.delete(draftId);
    if (deleteResult.isErr()) return err(deleteResult.unwrapErr());

    return sendResult;
  }
}
