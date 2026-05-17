import { UserId } from '../../shared/value-objects/user-id';
import { RoleVO } from '../../shared/value-objects/role';
import { Result } from '../../shared/result';
/**
 * UserIdentity Value Object.
 *
 * Represents an authenticated user's identity for authorization checks.
 * Injected into request context by AuthGuard after token verification.
 * Carries userId + role for roles.guard.ts checks.
 */
export declare class UserIdentity {
    private readonly userId;
    private readonly role;
    private constructor();
    static create(userId: UserId, role: RoleVO): Result<UserIdentity, Error>;
    getUserId(): UserId;
    getRole(): RoleVO;
    /**
     * Checks if this identity has at least the given role level.
     */
    hasRole(minimum: Parameters<RoleVO['isAtLeast']>[0]): boolean;
    equals(other: UserIdentity): boolean;
    toString(): string;
}
//# sourceMappingURL=user-identity.d.ts.map