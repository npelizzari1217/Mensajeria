import { Inject } from '@nestjs/common';
import {
  UserRepository, UserId, Email, EmpresaId,
  UserNotFoundError, EmailAlreadyExistsError, ForbiddenDomainError,
  Result, ok, err,
} from '@mensajeria/domain';
import { CallerContext } from '../dtos/caller-context.dto';
import { UserProfileDTO } from '../dtos/user-profile.dto';
import { roleIdToName } from '../role-name-mapper';

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  roleId?: number;
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
    if (caller.callerRoleId !== 1) {
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

    if (dto.roleId !== undefined) {
      // Validate roleId range
      if (dto.roleId < 1 || dto.roleId > 4 || !Number.isInteger(dto.roleId)) {
        return err(new Error('Invalid roleId: must be 1-4'));
      }
      // Enforce permissions: caller must be able to assign this role
      if (!user.canAssignRole(dto.roleId)) {
        return err(new ForbiddenDomainError('You do not have permission to assign this role'));
      }
      user.changeRoleId(dto.roleId);
    }

    const saveResult = await this.userRepo.save(user);
    if (saveResult.isErr()) return err(saveResult.unwrapErr());

    const roleId = user.getRoleId();
    return ok({
      id: user.getId().get(),
      email: user.getEmail().get(),
      name: user.getName(),
      role: { id: roleId, name: roleIdToName(roleId) },
      createdAt: user.getCreatedAt().toString(),
    });
  }
}
