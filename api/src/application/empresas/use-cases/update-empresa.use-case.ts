import { Inject } from '@nestjs/common';
import {
  Empresa,
  EmpresaId,
  EmpresaRepository,
  EmpresaNotFoundError,
  EmpresaNameAlreadyExistsError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { UpdateEmpresaDTO } from '../dtos/update-empresa.dto';
import { EmpresaProfileDTO } from '../dtos/empresa-profile.dto';

/**
 * UpdateEmpresaUseCase.
 *
 * Renames an existing empresa. Validates the new name,
 * checks uniqueness (only fails if another empresa has that name),
 * and persists the change.
 */
export class UpdateEmpresaUseCase {
  constructor(
    @Inject('EmpresaRepository')
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  async execute(
    empresaId: string,
    dto: UpdateEmpresaDTO,
  ): Promise<Result<EmpresaProfileDTO, Error>> {
    // 1. Reconstruct ID
    const id = EmpresaId.reconstruct(empresaId);

    // 2. Find empresa
    const findResult = await this.empresaRepo.findById(id);
    if (findResult.isErr()) {
      return err(new EmpresaNotFoundError(empresaId));
    }
    const empresa = findResult.unwrap();

    // 3. Check name uniqueness (only if a different empresa has this name)
    const exists = await this.empresaRepo.existsByNombre(dto.nombre.trim());
    if (exists && empresa.getNombre() !== dto.nombre.trim()) {
      return err(new EmpresaNameAlreadyExistsError(dto.nombre.trim()));
    }

    // 4. Rename
    const renameResult = empresa.rename(dto.nombre);
    if (renameResult.isErr()) {
      return err(renameResult.unwrapErr());
    }

    // 5. Persist
    const saveResult = await this.empresaRepo.save(empresa);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 6. Return updated profile
    return ok(toDTO(empresa));
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
