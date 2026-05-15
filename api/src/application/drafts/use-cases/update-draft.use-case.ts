import {
  DraftRepository, DraftNotFoundError,
  Result, ok, err,
} from '@mensajeria/domain';
import { UpdateDraftDTO, DraftResponse } from '../dtos/draft.dto';
import { SaveDraftUseCase } from './save-draft.use-case';

export class UpdateDraftUseCase {
  constructor(
    private readonly draftRepo: DraftRepository,
    private readonly saveDraftResponse: SaveDraftUseCase,
  ) {}

  async execute(
    id: string,
    userId: string,
    dto: UpdateDraftDTO,
  ): Promise<Result<DraftResponse, Error>> {
    const findResult = await this.draftRepo.findById(id);
    if (findResult.isErr()) return err(findResult.unwrapErr());

    const draft = findResult.unwrap();
    if (!draft) return err(new DraftNotFoundError(id));

    // Ownership check
    if (draft.getUserId().get() !== userId) {
      return err(new Error('Not authorized to update this draft'));
    }

    const updated = draft.update({
      subject: dto.subject !== undefined ? dto.subject : draft.getSubject(),
      body: dto.body ?? draft.getBody(),
      recipientIds: dto.recipientIds ?? [...draft.getRecipientIds()],
      groupId: dto.groupId !== undefined ? dto.groupId : draft.getGroupId(),
    });

    const saveResult = await this.draftRepo.update(updated);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    return ok(this.saveDraftResponse['toResponse'](updated));
  }
}
