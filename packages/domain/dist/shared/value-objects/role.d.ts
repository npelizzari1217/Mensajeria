import { Result } from '../result';
/**
 * Predefined role IDs (hierarchy by numeric value: lower = higher rank).
 * Use these constants instead of the old Role enum.
 */
export declare const ADMIN_ROLE_ID = 1;
export declare const SUPERVISOR_ROLE_ID = 2;
export declare const TECNICO_ROLE_ID = 3;
export declare const USUARIO_ROLE_ID = 4;
/**
 * Role Value Object.
 *
 * Wraps a numeric role ID with its human-readable name.
 * Guarantees that only valid role IDs are represented.
 *
 * Hierarchy: lower ID = higher rank.
 *   Admin(1) > Supervisor(2) > Técnico(3) > Usuario(4)
 */
export declare class RoleVO {
    private readonly id;
    private readonly name;
    private constructor();
    static create(id: number, name: string): Result<RoleVO, Error>;
    static reconstruct(id: number, name: string): RoleVO;
    getId(): number;
    getName(): string;
    /** @deprecated Use getId() instead — kept for migration compatibility */
    get(): number;
    equals(other: RoleVO): boolean;
    toString(): string;
    /**
     * Checks if this role has at least the rank of the given minimum role ID.
     * Lower ID = higher rank, so this.id <= minimum means "I am at least as
     * privileged as the required minimum".
     */
    isAtLeast(minimumId: number): boolean;
    static default(): RoleVO;
}
//# sourceMappingURL=role.d.ts.map