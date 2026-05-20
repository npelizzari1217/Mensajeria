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

export class ListUsersUseCase {
  constructor(@Inject('UserRepository') private readonly userRepo: UserRepository) {}

  async execute(caller: CallerContext): Promise<Result<UserProfileDTO[], Error>> {
    let result;
    if (caller.callerRole === 'Admin') {
      result = await this.userRepo.findAll();
    } else {
      const eid = EmpresaId.reconstruct(caller.callerEmpresaId);
      result = await this.userRepo.findAllByEmpresaId(eid);
    }

    if (result.isErr()) {
      return err(result.unwrapErr());
    }

    const users = result.unwrap().map((user: any) => ({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: user.getRole().get(),
      createdAt: user.getCreatedAt().toString(),
    }));

    return ok(users);
  }
}
