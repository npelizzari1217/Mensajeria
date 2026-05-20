import { Inject } from '@nestjs/common';
import {
  EmpresaId,
  UserId,
  EmpresaRepository,
  UserRepository,
  EmpresaNotFoundError,
  UserNotFoundError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { AssignUserToEmpresaDTO } from '../dtos/assign-user-to-empresa.dto';

/**
 * AssignUserToEmpresaUseCase.
 *
 * Links an existing user to an existing empresa.
 * Validates that both entities exist and the user is not already a member.
 */
export class AssignUserToEmpresaUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepo: UserRepository,
    @Inject('EmpresaRepository')
    private readonly empresaRepo: EmpresaRepository,
  ) {}

  async execute(
    empresaId: string,
    dto: AssignUserToEmpresaDTO,
  ): Promise<Result<void, Error>> {
    // 1. Reconstruct empresa ID
    const eid = EmpresaId.reconstruct(empresaId);

    // 2. Verify empresa exists
    const empresaResult = await this.empresaRepo.findById(eid);
    if (empresaResult.isErr()) {
      return err(new EmpresaNotFoundError(empresaId));
    }

    // 3. Parse user ID
    const userIdResult = UserId.create(dto.userId);
    if (userIdResult.isErr()) {
      return err(userIdResult.unwrapErr());
    }
    const uid = userIdResult.unwrap();

    // 4. Verify user exists
    const userResult = await this.userRepo.findById(uid);
    if (userResult.isErr()) {
      return err(new UserNotFoundError(dto.userId));
    }

    // 5. Check if user is already a member
    const isMember = await this.userRepo.isMemberOf(uid, eid);
    if (isMember) {
      return err(new Error('User is already a member of this empresa'));
    }

    // 6. Add to empresa
    const addResult = await this.userRepo.addToEmpresa(
      uid,
      eid,
      dto.role ?? 'USUARIO',
    );
    if (addResult.isErr()) {
      return err(addResult.unwrapErr());
    }

    // 7. Return void
    return ok(undefined);
  }
}
