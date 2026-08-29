import { Inject } from '@nestjs/common';
import {
  UserRepository,
  EmpresaId,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { CallerContext } from '../dtos/caller-context.dto';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { roleIdToName } from '../role-name-mapper';

export class ListUsersUseCase {
  constructor(@Inject('UserRepository') private readonly userRepo: UserRepository) {}

  async execute(caller: CallerContext, roleId?: number): Promise<Result<UserProfileDTO[], Error>> {
    let result;
    if (caller.callerRoleId === 1) {
      // Admin (1) sees all users
      result = await this.userRepo.findAll();
    } else {
      // Non-Admin: scoped to their empresa, optionally filtered by roleId
      const eid = EmpresaId.reconstruct(caller.callerEmpresaId);
      result = await this.userRepo.findAllByEmpresaId(eid, roleId);
    }

    if (result.isErr()) {
      return err(result.unwrapErr());
    }

    const users = result.unwrap().map((user) => ({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: { id: user.getRoleId(), name: roleIdToName(user.getRoleId()) },
      createdAt: user.getCreatedAt().toString(),
    }));

    return ok(users);
  }
}
