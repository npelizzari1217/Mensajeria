import { Inject } from '@nestjs/common';
import {
  DraftRepository, EmpresaId, DraftNotFoundError, Result, ok, err,
} from '@mensajeria/domain';

export class DeleteDraftUseCase {
  constructor(
    @Inject('DraftRepository') private readonly draftRepo: DraftRepository,
  ) {}

  async execute(id: string, userId: string, empresaId: string): Promise<Result<void, Error>> {
    const eid = EmpresaId.create(empresaId);
    if (eid.isErr()) return err(eid.unwrapErr());

    const findResult = await this.draftRepo.findById(id, eid.unwrap());
    if (findResult.isErr()) return err(findResult.unwrapErr());

    const draft = findResult.unwrap();
    if (!draft) return err(new DraftNotFoundError(id));

    // Ownership check
    if (draft.getUserId().get() !== userId) {
      return err(new Error('Not authorized to delete this draft'));
    }

    return this.draftRepo.delete(id);
  }
}
