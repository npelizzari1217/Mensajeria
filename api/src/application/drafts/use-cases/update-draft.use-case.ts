import { Inject } from '@nestjs/common';
import {
  DraftRepository, EmpresaId, DraftNotFoundError, UserRepository, UserId, Email,
  Result, ok, err,
} from '@mensajeria/domain';
import { UpdateDraftDTO, DraftResponse } from '../dtos/draft.dto';
import { SaveDraftUseCase } from './save-draft.use-case';

export class UpdateDraftUseCase {
  constructor(
    @Inject('DraftRepository') private readonly draftRepo: DraftRepository,
    @Inject('UserRepository') private readonly userRepo: UserRepository,
    private readonly saveDraftResponse: SaveDraftUseCase,
  ) {}

  async execute(
    id: string,
    userId: string,
    dto: UpdateDraftDTO,
    empresaId: string,
  ): Promise<Result<DraftResponse, Error>> {
    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const findResult = await this.draftRepo.findById(id, eid.unwrap());
    if (findResult.isErr()) return err(findResult.unwrapErr());

    const draft = findResult.unwrap();
    if (!draft) return err(new DraftNotFoundError(id));

    if (draft.getUserId().get() !== userId) {
      return err(new Error('Not authorized to update this draft'));
    }

    // Resolve recipient emails to IDs
    let recipientIds: string[] = [];
    if (dto.recipientEmails !== undefined) {
      for (const rawEmail of dto.recipientEmails) {
        const emailResult = Email.create(rawEmail);
        if (emailResult.isErr()) continue;
        const userResult = await this.userRepo.findByEmail(emailResult.unwrap());
        if (userResult.isOk()) {
          recipientIds.push(userResult.unwrap().getId().get());
        }
      }
    } else {
      recipientIds = [...draft.getRecipientIds()];
    }

    const updated = draft.update({
      subject: dto.subject !== undefined ? dto.subject : draft.getSubject(),
      body: dto.body ?? draft.getBody(),
      recipientIds,
      groupId: dto.groupId !== undefined ? dto.groupId : draft.getGroupId(),
    });

    const saveResult = await this.draftRepo.update(updated);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    return ok(await this.saveDraftResponse.toResponse(updated));
  }
}
