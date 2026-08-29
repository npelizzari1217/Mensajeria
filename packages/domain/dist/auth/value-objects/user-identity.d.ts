import { UserId } from '../../shared/value-objects/user-id';
import { Result } from '../../shared/result';
/**
 * UserIdentity Value Object.
 *
 * Represents an authenticated user's identity for authorization checks.
 * Injected into request context by AuthGuard after token verification.
 * Carries userId + roleId + roleName for consistent authorization.
 */
export declare class UserIdentity {
    private readonly userId;
    private readonly roleId;
    private readonly roleName;
    private constructor();
    static from(props: {
        id: UserId;
        roleId: number;
        roleName: string;
        empresaId?: string;
    }): Result<UserIdentity, Error>;
    getUserId(): UserId;
    getRoleId(): number;
    getRoleName(): string;
    /**
     * Checks if this identity has at least the given role level.
     * Lower roleId = higher rank, so this.roleId <= required means
     * "I am at least as privileged as the required minimum".
     */
    hasRole(requiredRoleId: number): boolean;
    equals(other: UserIdentity): boolean;
    toString(): string;
}
//# sourceMappingURL=user-identity.d.ts.map