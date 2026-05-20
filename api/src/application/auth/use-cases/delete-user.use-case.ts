import { Inject } from '@nestjs/common';
import {
  UserRepository, UserId, EmpresaId,
  UserNotFoundError, ForbiddenDomainError,
  Result, ok, err,
} from '@mensajeria/domain';
import { CallerContext } from '../dtos/caller-context.dto';

export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(userId: string, caller: CallerContext): Promise<Result<void, Error>> {
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const userResult = await this.userRepo.findById(uid);
    if (userResult.isErr()) return err(new UserNotFoundError(userId));

    // Enforce empresa scoping for non-Admin callers
    if (caller.callerRole !== 'Admin') {
      const isMember = await this.userRepo.isMemberOf(
        uid,
        EmpresaId.reconstruct(caller.callerEmpresaId),
      );
      if (!isMember) {
        return err(new ForbiddenDomainError('Cannot delete user from a different empresa'));
      }
    }

    return await this.userRepo.delete(uid);
  }
}
