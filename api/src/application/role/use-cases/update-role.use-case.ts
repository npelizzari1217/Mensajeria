import {
  Role,
  RoleId,
  RoleName,
  RoleRepository,
  ForbiddenDomainError,
  NotFoundError,
  RoleNameAlreadyExistsError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { UpdateRoleDTO } from '../dtos/update-role.dto';
import { RoleProfileDTO } from '../dtos/role-profile.dto';

/**
 * UpdateRoleUseCase.
 *
 * Validates the role exists, checks name uniqueness if changed,
 * updates the role entity, and persists it.
 * Only Admin can update roles.
 */
export class UpdateRoleUseCase {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(dto: UpdateRoleDTO): Promise<Result<RoleProfileDTO, Error>> {
    // 1. Check permissions — only Admin
    if (dto.caller.callerRole !== 'Admin') {
      return err(new ForbiddenDomainError('Only Admin can update roles'));
    }

    // 2. Validate role exists
    const roleId = RoleId.reconstruct(dto.id);
    const role = await this.roleRepo.findById(roleId);
    if (!role) {
      return err(new NotFoundError('Role', String(dto.id)));
    }

    // 3. Validate & update name (if changed)
    const nameResult = RoleName.create(dto.name);
    if (nameResult.isErr()) {
      return err(nameResult.unwrapErr());
    }
    const newName = nameResult.unwrap();

    if (!role.getName().equals(newName)) {
      const dup = await this.roleRepo.findByName(newName);
      if (dup && !dup.id.equals(role.id)) {
        return err(new RoleNameAlreadyExistsError(newName.get()));
      }
      role.rename(newName);
    }

    // 4. Update description (if provided and non-empty)
    if (dto.description != null && dto.description.trim() !== '') {
      role.changeDescription(dto.description);
    }

    // 5. Persist
    await this.roleRepo.save(role);

    // 6. Return profile
    return ok(toDTO(role));
  }
}

function toDTO(role: Role): RoleProfileDTO {
  return {
    id: role.id.get(),
    name: role.getName().get(),
    description: role.getDescription(),
  };
}
