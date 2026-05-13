import { UserId } from '../../shared/value-objects/user-id';
import { RoleVO } from '../../shared/value-objects/role';
import { Result, ok, err } from '../../shared/result';

/**
 * UserIdentity Value Object.
 *
 * Represents an authenticated user's identity for authorization checks.
 * Injected into request context by AuthGuard after token verification.
 * Carries userId + role for roles.guard.ts checks.
 */
export class UserIdentity {
  private constructor(
    private readonly userId: UserId,
    private readonly role: RoleVO,
  ) {
    Object.freeze(this);
  }

  static create(userId: UserId, role: RoleVO): Result<UserIdentity, Error> {
    if (!userId) {
      return err(new Error('UserIdentity requires a valid UserId'));
    }
    if (!role) {
      return err(new Error('UserIdentity requires a valid Role'));
    }
    return ok(new UserIdentity(userId, role));
  }

  getUserId(): UserId {
    return this.userId;
  }

  getRole(): RoleVO {
    return this.role;
  }

  /**
   * Checks if this identity has at least the given role level.
   */
  hasRole(minimum: Parameters<RoleVO['isAtLeast']>[0]): boolean {
    return this.role.isAtLeast(minimum);
  }

  equals(other: UserIdentity): boolean {
    return this.userId.equals(other.userId) && this.role.equals(other.role);
  }

  toString(): string {
    return `UserIdentity(${this.userId.toString()}, ${this.role.toString()})`;
  }
}
