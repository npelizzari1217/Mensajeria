import { Inject } from '@nestjs/common';
import {
  DraftRepository, EmpresaId, DraftNotFoundError,
  Result, ok, err,
} from '@mensajeria/domain';
import { DraftResponse } from '../dtos/draft.dto';
import { SaveDraftUseCase } from './save-draft.use-case';

export class GetDraftUseCase {
  constructor(
    @Inject('DraftRepository') private readonly draftRepo: DraftRepository,
    private readonly saveDraftResponse: SaveDraftUseCase,
  ) {}

  async execute(id: string, userId: string, empresaId: string): Promise<Result<DraftResponse, Error>> {
    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const findResult = await this.draftRepo.findById(id, eid.unwrap());
    if (findResult.isErr()) return err(findResult.unwrapErr());

    const draft = findResult.unwrap();
    if (!draft) return err(new DraftNotFoundError(id));

    if (draft.getUserId().get() !== userId) {
      return err(new Error('Not authorized to access this draft'));
    }

    return ok(await this.saveDraftResponse.toResponse(draft));
  }
}
