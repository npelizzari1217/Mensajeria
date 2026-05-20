import { Inject } from '@nestjs/common';
import {
  Empresa,
  EmpresaRepository,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { EmpresaProfileDTO } from '../dtos/empresa-profile.dto';

/**
 * ListEmpresasUseCase.
 *
 * Returns all empresas in the system.
 */
export class ListEmpresasUseCase {
  constructor(
    @Inject('EmpresaRepository')
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  async execute(): Promise<Result<EmpresaProfileDTO[], Error>> {
    const result = await this.empresaRepo.findAll();
    if (result.isErr()) {
      return err(result.unwrapErr());
    }

    const empresas = result.unwrap().map(toDTO);
    return ok(empresas);
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
