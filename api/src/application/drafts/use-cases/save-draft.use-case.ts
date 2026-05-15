import {
  Draft, DraftRepository, UserId, Result, ok, err,
} from '@mensajeria/domain';
import { SaveDraftDTO, DraftResponse } from '../dtos/draft.dto';

export class SaveDraftUseCase {
  constructor(
    private readonly draftRepo: DraftRepository,
  ) {}

  async execute(dto: SaveDraftDTO): Promise<Result<DraftResponse, Error>> {
    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isErr()) return err(userIdResult.unwrapErr());

    if (!dto.body || dto.body.trim().length === 0) {
      return err(new Error('Draft body is required'));
    }

    const draftResult = Draft.create({
      userId: userIdResult.unwrap(),
      subject: dto.subject ?? null,
      body: dto.body,
      recipientIds: dto.recipientIds ?? [],
      groupId: dto.groupId ?? null,
    });

    if (draftResult.isErr()) return err(draftResult.unwrapErr());

    const draft = draftResult.unwrap();
    const saveResult = await this.draftRepo.save(draft);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    return ok(this.toResponse(draft));
  }

  private toResponse(draft: Draft): DraftResponse {
    return {
      id: draft.getId(),
      userId: draft.getUserId().get(),
      subject: draft.getSubject(),
      body: draft.getBody(),
      recipientIds: [...draft.getRecipientIds()],
      groupId: draft.getGroupId(),
      createdAt: draft.getCreatedAt().toString(),
      updatedAt: draft.getUpdatedAt().toString(),
    };
  }
}
