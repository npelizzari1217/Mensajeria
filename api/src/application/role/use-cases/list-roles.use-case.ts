import {
  Role,
  RoleRepository,
  ForbiddenDomainError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { CallerContext } from '../../auth/dtos/caller-context.dto';
import { RoleProfileDTO } from '../dtos/role-profile.dto';

/**
 * ListRolesUseCase.
 *
 * Returns all roles ordered by ID (hierarchy order).
 * Admin and Supervisor can list. Other roles get ForbiddenError.
 */
export class ListRolesUseCase {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(caller: CallerContext): Promise<Result<RoleProfileDTO[], Error>> {
    if (caller.callerRole !== 'Admin' && caller.callerRole !== 'Supervisor') {
      return err(new ForbiddenDomainError('Only Admin and Supervisor can list roles'));
    }

    const roles = await this.roleRepo.findAll();
    return ok(roles.map(toDTO));
  }
}

function toDTO(role: Role): RoleProfileDTO {
  return {
    id: role.id.get(),
    name: role.getName().get(),
    description: role.getDescription(),
  };
}
