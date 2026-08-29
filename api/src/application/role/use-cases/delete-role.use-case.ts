import {
  RoleId,
  RoleRepository,
  ForbiddenDomainError,
  NotFoundError,
  RoleHasUsersError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { CallerContext } from '../../auth/dtos/caller-context.dto';

/**
 * DeleteRoleDTO — input for the delete role use case.
 */
export interface DeleteRoleDTO {
  id: number;
  caller: CallerContext;
}

/**
 * DeleteRoleUseCase.
 *
 * Validates the role exists, checks that no users are assigned,
 * and deletes the role. Only Admin can delete roles.
 */
export class DeleteRoleUseCase {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(dto: DeleteRoleDTO): Promise<Result<void, Error>> {
    // 1. Check permissions — only Admin
    if (dto.caller.callerRole !== 'Admin') {
      return err(new ForbiddenDomainError('Only Admin can delete roles'));
    }

    // 2. Validate role exists
    const roleId = RoleId.reconstruct(dto.id);
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      return err(new NotFoundError('Role', String(dto.id)));
    }

    // 3. Check if role has users assigned
    const hasUsers = await this.roleRepo.hasUsers(roleId);
    if (hasUsers) {
      return err(new RoleHasUsersError(dto.id));
    }

    // 4. Delete
    await this.roleRepo.delete(roleId);

    return ok(undefined);
  }
}
