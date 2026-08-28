import { Result, ok, err } from '../../shared/result';

/**
 * RoleId Value Object.
 *
 * Wraps a positive integer that identifies a system role.
 * Hierarchy is encoded in the numeric value: lower ID = higher rank.
 *
 * Constants:
 *   RoleId.Admin      = 1  (máxima jerarquía)
 *   RoleId.Supervisor = 2
 *   RoleId.Tecnico     = 3
 *   RoleId.Usuario    = 4  (mínima jerarquía)
 */
export class RoleId {
  private constructor(private readonly value: number) {
    Object.freeze(this);
  }

  static create(id: number): Result<RoleId, Error> {
    if (!Number.isInteger(id)) {
      return err(new Error('Role ID must be an integer'));
    }
    if (id <= 0) {
      return err(new Error('Role ID must be a positive integer'));
    }
    return ok(new RoleId(id));
  }

  static reconstruct(id: number): RoleId {
    return new RoleId(id);
  }

  get(): number {
    return this.value;
  }

  equals(other: RoleId): boolean {
    return this.value === other.value;
  }

  /**
   * Checks if this role has at least the rank of the given minimum.
   *
   * Lower ID = higher rank, so this.value <= minimum.value means
   * "I am at least as privileged as the minimum required".
   *
   * @example
   *   RoleId.Admin.isAtLeast(RoleId.Supervisor)     // true  (1 <= 2)
   *   RoleId.Tecnico.isAtLeast(RoleId.Supervisor)   // false (3 > 2)
   */
  isAtLeast(minimum: RoleId): boolean {
    return this.value <= minimum.value;
  }

  toString(): string {
    return String(this.value);
  }

  // --- Static constants ---

  static readonly Admin = RoleId.reconstruct(1);
  static readonly Supervisor = RoleId.reconstruct(2);
  static readonly Tecnico = RoleId.reconstruct(3);
  static readonly Usuario = RoleId.reconstruct(4);
}
