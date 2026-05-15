import {
  DraftRepository, Result, ok, err,
} from '@mensajeria/domain';
import { DraftResponse } from '../dtos/draft.dto';
import { SaveDraftUseCase } from './save-draft.use-case';

export class ListDraftsUseCase {
  constructor(
    private readonly draftRepo: DraftRepository,
    private readonly saveDraftResponse: SaveDraftUseCase,
  ) {}

  async execute(userId: string): Promise<Result<DraftResponse[], Error>> {
    const draftsResult = await this.draftRepo.findByUserId(userId);
    if (draftsResult.isErr()) return err(draftsResult.unwrapErr());

    const drafts = draftsResult.unwrap();
    return ok(drafts.map((d) => this.saveDraftResponse['toResponse'](d)));
  }
}
