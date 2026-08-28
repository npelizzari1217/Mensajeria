import { Result, ok, err } from '../result';

/**
 * Predefined role IDs (hierarchy by numeric value: lower = higher rank).
 * Use these constants instead of the old Role enum.
 */
export const ADMIN_ROLE_ID = 1;
export const SUPERVISOR_ROLE_ID = 2;
export const TECNICO_ROLE_ID = 3;
export const USUARIO_ROLE_ID = 4;

/**
 * Role Value Object.
 *
 * Wraps a numeric role ID with its human-readable name.
 * Guarantees that only valid role IDs are represented.
 *
 * Hierarchy: lower ID = higher rank.
 *   Admin(1) > Supervisor(2) > Técnico(3) > Usuario(4)
 */
export class RoleVO {
  private constructor(
    private readonly id: number,
    private readonly name: string,
  ) {
    Object.freeze(this);
  }

  static create(id: number, name: string): Result<RoleVO, Error> {
    if (!Number.isInteger(id) || id <= 0) {
      return err(new Error('Role ID must be a positive integer'));
    }
    if (!name || name.trim().length === 0) {
      return err(new Error('Role name cannot be empty'));
    }
    return ok(new RoleVO(id, name.trim()));
  }

  static reconstruct(id: number, name: string): RoleVO {
    return new RoleVO(id, name);
  }

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  /** @deprecated Use getId() instead — kept for migration compatibility */
  get(): number {
    return this.id;
  }

  equals(other: RoleVO): boolean {
    return this.id === other.id && this.name === other.name;
  }

  toString(): string {
    return this.name;
  }

  /**
   * Checks if this role has at least the rank of the given minimum role ID.
   * Lower ID = higher rank, so this.id <= minimum means "I am at least as
   * privileged as the required minimum".
   */
  isAtLeast(minimumId: number): boolean {
    return this.id <= minimumId;
  }

  static default(): RoleVO {
    return new RoleVO(USUARIO_ROLE_ID, 'Usuario');
  }
}
