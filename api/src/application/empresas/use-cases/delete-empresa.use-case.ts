import { Inject } from '@nestjs/common';
import {
  EmpresaId,
  EmpresaRepository,
  EmpresaNotFoundError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';

/**
 * DeleteEmpresaUseCase.
 *
 * Deletes an empresa by its ID. Fails if the empresa does not exist.
 */
export class DeleteEmpresaUseCase {
  constructor(
    @Inject('EmpresaRepository')
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  async execute(empresaId: string): Promise<Result<void, Error>> {
    // 1. Reconstruct ID
    const id = EmpresaId.reconstruct(empresaId);

    // 2. Find empresa (must exist to delete)
    const findResult = await this.empresaRepo.findById(id);
    if (findResult.isErr()) {
      return err(new EmpresaNotFoundError(empresaId));
    }

    // 3. Delete
    const deleteResult = await this.empresaRepo.delete(id);
    if (deleteResult.isErr()) {
      return err(deleteResult.unwrapErr());
    }

    // 4. Return void
    return ok(undefined);
  }
}
