import { Inject } from '@nestjs/common';
import {
  DraftRepository, EmpresaId, Result, ok, err,
} from '@mensajeria/domain';
import { DraftResponse } from '../dtos/draft.dto';
import { SaveDraftUseCase } from './save-draft.use-case';

export class ListDraftsUseCase {
  constructor(
    @Inject('DraftRepository') private readonly draftRepo: DraftRepository,
    private readonly saveDraftResponse: SaveDraftUseCase,
  ) {}

  async execute(userId: string, empresaId: string): Promise<Result<DraftResponse[], Error>> {
    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const draftsResult = await this.draftRepo.findByUserId(userId, eid.unwrap());
    if (draftsResult.isErr()) return err(draftsResult.unwrapErr());

    const drafts = draftsResult.unwrap();
    const responses = await Promise.all(
      drafts.map((d) => this.saveDraftResponse.toResponse(d)),
    );
    return ok(responses);
  }
}
