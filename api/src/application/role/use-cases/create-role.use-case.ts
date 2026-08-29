import {
  Role,
  RoleId,
  RoleName,
  RoleRepository,
  ForbiddenDomainError,
  RoleNameAlreadyExistsError,
  Result,
  ok,
  err,
} from '@mensajeria/domain';
import { CreateRoleDTO } from '../dtos/create-role.dto';
import { RoleProfileDTO } from '../dtos/role-profile.dto';

/**
 * CreateRoleUseCase.
 *
 * Validates the role name, checks uniqueness,
 * determines the next ID, creates the Role entity,
 * and persists it. Only Admin can create roles.
 */
export class CreateRoleUseCase {
  constructor(
    private readonly roleRepo: RoleRepository,
  ) {}

  async execute(dto: CreateRoleDTO): Promise<Result<RoleProfileDTO, Error>> {
    // 1. Check permissions — only Admin
    if (dto.caller.callerRole !== 'Admin') {
      return err(new ForbiddenDomainError('Only Admin can create roles'));
    }

    // 2. Validate name
    const nameResult = RoleName.create(dto.name);
    if (nameResult.isErr()) {
      return err(nameResult.unwrapErr());
    }
    const name = nameResult.unwrap();

    // 3. Check uniqueness
    const existing = await this.roleRepo.findByName(name);
    if (existing) {
      return err(new RoleNameAlreadyExistsError(name.get()));
    }

    // 4. Determine next ID (auto-incremental)
    const roles = await this.roleRepo.findAll();
    const maxId = roles.reduce((max, r) => Math.max(max, r.id.get()), 0);
    const nextId = RoleId.reconstruct(maxId + 1);

    // 5. Create domain entity
    const roleResult = Role.create({
      id: nextId,
      name,
      description: dto.description ?? '',
    });
    if (roleResult.isErr()) {
      return err(roleResult.unwrapErr());
    }
    const role = roleResult.unwrap();

    // 6. Persist
    await this.roleRepo.save(role);

    // 7. Return profile
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
