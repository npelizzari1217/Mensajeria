import { Inject } from '@nestjs/common';
import {
  Empresa,
  EmpresaId,
  EmpresaRepository,
  EmpresaNotFoundError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { EmpresaProfileDTO } from '../dtos/empresa-profile.dto';

/**
 * GetEmpresaUseCase.
 *
 * Finds a single empresa by its ID.
 */
export class GetEmpresaUseCase {
  constructor(
    @Inject('EmpresaRepository')
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  async execute(empresaId: string): Promise<Result<EmpresaProfileDTO, Error>> {
    // 1. Reconstruct ID
    const id = EmpresaId.reconstruct(empresaId);

    // 2. Find empresa
    const result = await this.empresaRepo.findById(id);
    if (result.isErr()) {
      return err(new EmpresaNotFoundError(empresaId));
    }

    // 3. Return profile
    return ok(toDTO(result.unwrap()));
  }
}

function toDTO(e: Empresa): EmpresaProfileDTO {
  return {
    id: e.getId().get(),
    nombre: e.getNombre(),
    createdAt: e.getCreatedAt().toString(),
    updatedAt: e.getUpdatedAt().toString(),
  };
}
