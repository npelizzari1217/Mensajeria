import { Result } from '../result';
/**
 * Role enum — user authorization levels.
 *
 * Hierarchical: Admin > Supervisor > Tecnico > Usuario
 */
export declare enum Role {
    Admin = "Admin",
    Supervisor = "Supervisor",
    Tecnico = "Tecnico",
    Usuario = "Usuario"
}
/**
 * Role Value Object.
 *
 * Wraps a Role enum with safe construction and comparison.
 * Guarantees that only valid system roles are represented.
 */
export declare class RoleVO {
    private readonly value;
    private constructor();
    static create(raw: string): Result<RoleVO, Error>;
    static reconstruct(raw: string): RoleVO;
    get(): Role;
    equals(other: RoleVO): boolean;
    toString(): string;
    isAtLeast(minimum: Role): boolean;
    static default(): RoleVO;
}
//# sourceMappingURL=role.d.ts.map