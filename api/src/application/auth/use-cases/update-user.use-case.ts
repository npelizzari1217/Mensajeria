import { Inject } from '@nestjs/common';
import {
  UserRepository, UserId, Email, RoleVO, EmpresaId,
  UserNotFoundError, EmailAlreadyExistsError, ForbiddenDomainError,
  Result, ok, err,
} from '@mensajeria/domain';
import { CallerContext } from '../dtos/caller-context.dto';
import { UserProfileDTO } from '../dtos/user-profile.dto';

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: string;
}

export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository') private readonly userRepo: UserRepository,
  ) {}

  async execute(userId: string, dto: UpdateUserDTO, caller: CallerContext): Promise<Result<UserProfileDTO, Error>> {
    const uidResult = UserId.create(userId);
    if (uidResult.isErr()) return err(uidResult.unwrapErr());
    const uid = uidResult.unwrap();

    const userResult = await this.userRepo.findById(uid);
    if (userResult.isErr()) return err(new UserNotFoundError(userId));
    const user = userResult.unwrap();

    // Enforce empresa scoping for non-Admin callers
    if (caller.callerRole !== 'Admin') {
      const isMember = await this.userRepo.isMemberOf(
        uid,
        EmpresaId.reconstruct(caller.callerEmpresaId),
      );
      if (!isMember) {
        return err(new ForbiddenDomainError('Cannot update user from a different empresa'));
      }
    }

    if (dto.name !== undefined) {
      const nameResult = user.changeName(dto.name);
      if (nameResult.isErr()) return err(nameResult.unwrapErr());
    }

    if (dto.email !== undefined) {
      const emailResult = Email.create(dto.email);
      if (emailResult.isErr()) return err(emailResult.unwrapErr());

      const newEmail = emailResult.unwrap();
      if (!user.getEmail().equals(newEmail)) {
        const exists = await this.userRepo.existsByEmail(newEmail);
        if (exists) return err(new EmailAlreadyExistsError(newEmail.get()));
        user.changeEmail(newEmail);
      }
    }

    if (dto.role !== undefined) {
      const roleResult = RoleVO.create(dto.role);
      if (roleResult.isErr()) return err(roleResult.unwrapErr());
      user.changeRole(roleResult.unwrap());
    }

    const saveResult = await this.userRepo.save(user);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    return ok({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: user.getRole().get(),
      createdAt: user.getCreatedAt().toString(),
    });
  }
}
