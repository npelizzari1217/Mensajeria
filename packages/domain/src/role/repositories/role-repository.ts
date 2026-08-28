import { Role } from '../entities/role';
import { RoleId } from '../value-objects/role-id';
import { RoleName } from '../value-objects/role-name';

/**
 * RoleRepository port.
 *
 * Defines the contract for persisting and retrieving Role aggregates.
 * Implementation belongs in infrastructure/ (PrismaRoleRepository).
 *
 * This is a pure interface — no infrastructure imports, no ORM bindings.
 */
export interface RoleRepository {
  /**
   * Finds a role by its unique numeric ID.
   * Returns null when no role with the given ID exists.
   */
  findById(id: RoleId): Promise<Role | null>;

  /**
   * Finds a role by its unique name (case-sensitive).
   * Returns null when no role with the given name exists.
   */
  findByName(name: RoleName): Promise<Role | null>;

  /**
   * Returns all roles, typically ordered by ID ascending (hierarchy order).
   */
  findAll(): Promise<Role[]>;

  /**
   * Persists a role (create or update).
   */
  save(role: Role): Promise<void>;

  /**
   * Deletes a role by ID.
   */
  delete(id: RoleId): Promise<void>;

  /**
   * Checks if any users are currently assigned to this role.
   * Used by DeleteRoleUseCase to prevent deletion of roles in use.
   */
  hasUsers(id: RoleId): Promise<boolean>;
}
