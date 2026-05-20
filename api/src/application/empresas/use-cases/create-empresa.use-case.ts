import { Inject } from '@nestjs/common';
import {
  Empresa,
  EmpresaRepository,
  EmpresaNameAlreadyExistsError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { CreateEmpresaDTO } from '../dtos/create-empresa.dto';
import { EmpresaProfileDTO } from '../dtos/empresa-profile.dto';

/**
 * CreateEmpresaUseCase.
 *
 * Validates the empresa name, checks uniqueness,
 * creates the Empresa entity, and persists it.
 */
export class CreateEmpresaUseCase {
  constructor(
    @Inject('EmpresaRepository')
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  async execute(dto: CreateEmpresaDTO): Promise<Result<EmpresaProfileDTO, Error>> {
    // 1. Validate nombre
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      return err(new Error('Empresa name cannot be empty'));
    }
    if (dto.nombre.length > 100) {
      return err(new Error('Empresa name must be 100 characters or less'));
    }

    // 2. Check uniqueness
    const exists = await this.empresaRepo.existsByNombre(dto.nombre.trim());
    if (exists) {
      return err(new EmpresaNameAlreadyExistsError(dto.nombre.trim()));
    }

    // 3. Create domain entity
    const empresaResult = Empresa.create(dto.nombre);
    if (empresaResult.isErr()) {
      return err(empresaResult.unwrapErr());
    }
    const empresa = empresaResult.unwrap();

    // 4. Persist
    const saveResult = await this.empresaRepo.save(empresa);
    if (saveResult.isErr()) {
      return err(saveResult.unwrapErr());
    }

    // 5. Return profile
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
