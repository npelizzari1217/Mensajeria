import { RoleId } from '../value-objects/role-id';
import { RoleName } from '../value-objects/role-name';
import { Result, ok, err } from '../../shared/result';

export interface CreateRoleProps {
  id: RoleId;
  name: RoleName;
  description: string;
}

export interface RoleProps {
  id: RoleId;
  name: RoleName;
  description: string;
}

/**
 * Role entity — represents a system authorization role.
 *
 * Hierarchy is encoded in the numeric RoleId: lower ID = higher rank.
 * Behavior methods enforce the hierarchy:
 *   - isHigherThan(other): true when this.id < other.id
 *   - isAtLeast(minimum): true when this.id <= minimum.value
 *
 * Does NOT depend on infrastructure (Prisma, NestJS, etc.).
 * Persistence goes through RoleRepository (port).
 */
export class Role {
  private constructor(
    readonly id: RoleId,
    private name: RoleName,
    private description: string,
  ) {}

  /**
   * Factory for new roles. Validates description is not empty.
   */
  static create(props: CreateRoleProps): Result<Role, Error> {
    const desc = props.description?.trim();
    if (!desc || desc.length === 0) {
      return err(new Error('Role description cannot be empty'));
    }
    return ok(
      new Role(props.id, props.name, desc),
    );
  }

  /**
   * Trusted reconstruction from persistence — skips validation.
   */
  static reconstruct(props: RoleProps): Role {
    return new Role(props.id, props.name, props.description);
  }

  getName(): RoleName {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  /**
   * Updates the role's display name.
   */
  rename(newName: RoleName): void {
    this.name = newName;
  }

  /**
   * Updates the role's description.
   */
  changeDescription(desc: string): void {
    const trimmed = desc.trim();
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Description cannot be empty');
    }
    this.description = trimmed;
  }

  /**
   * Checks if this role has strictly higher rank than the given role.
   * Lower ID = higher rank.
   *
   * @example
   *   admin.isHigherThan(user)     // true  (1 < 4)
   *   user.isHigherThan(admin)     // false (4 > 1)
   */
  isHigherThan(other: Role): boolean {
    return this.id.get() < other.id.get();
  }

  /**
   * Checks if this role has at least the rank of the given minimum.
   * Delegates to RoleId.isAtLeast().
   */
  isAtLeast(minimum: RoleId): boolean {
    return this.id.isAtLeast(minimum);
  }
}
