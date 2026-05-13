import { Result, ok, err } from '../result';

/**
 * Role enum — user authorization levels.
 *
 * Hierarchical: Admin > Supervisor > Tecnico > Usuario
 */
export enum Role {
  Admin = 'Admin',
  Supervisor = 'Supervisor',
  Tecnico = 'Tecnico',
  Usuario = 'Usuario',
}

const VALID_ROLES = Object.values(Role) as string[];

/**
 * Role Value Object.
 *
 * Wraps a Role enum with safe construction and comparison.
 * Guarantees that only valid system roles are represented.
 */
export class RoleVO {
  private constructor(private readonly value: Role) {
    Object.freeze(this);
  }

  static create(raw: string): Result<RoleVO, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('Role cannot be empty'));
    }
    const normalized = raw.trim();
    // Accept both "Admin" and "admin", but always store the canonical form
    const match = VALID_ROLES.find(
      (r) => r.toLowerCase() === normalized.toLowerCase(),
    );
    if (!match) {
      return err(
        new Error(
          `Invalid role '${raw}'. Valid roles: ${VALID_ROLES.join(', ')}`,
        ),
      );
    }
    return ok(new RoleVO(match as Role));
  }

  static reconstruct(raw: string): RoleVO {
    return new RoleVO(raw as Role);
  }

  get(): Role {
    return this.value;
  }

  equals(other: RoleVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  isAtLeast(minimum: Role): boolean {
    const hierarchy: Role[] = [Role.Admin, Role.Supervisor, Role.Tecnico, Role.Usuario];
    const currentIndex = hierarchy.indexOf(this.value);
    const minimumIndex = hierarchy.indexOf(minimum);
    return currentIndex >= 0 && currentIndex <= minimumIndex;
  }

  static default(): RoleVO {
    return new RoleVO(Role.Usuario);
  }
}
