import { UserId } from '../../shared/value-objects/user-id';
import { Result, ok, err } from '../../shared/result';

/**
 * UserIdentity Value Object.
 *
 * Represents an authenticated user's identity for authorization checks.
 * Injected into request context by AuthGuard after token verification.
 * Carries userId + roleId + roleName for consistent authorization.
 */
export class UserIdentity {
  private constructor(
    private readonly userId: UserId,
    private readonly roleId: number,
    private readonly roleName: string,
  ) {
    Object.freeze(this);
  }

  static from(props: {
    id: UserId;
    roleId: number;
    roleName: string;
    empresaId?: string;
  }): Result<UserIdentity, Error> {
    if (!props.id) {
      return err(new Error('UserIdentity requires a valid UserId'));
    }
    if (!Number.isInteger(props.roleId) || props.roleId <= 0) {
      return err(new Error('UserIdentity requires a valid roleId (positive integer)'));
    }
    if (!props.roleName || props.roleName.trim().length === 0) {
      return err(new Error('UserIdentity requires a valid roleName'));
    }
    return ok(new UserIdentity(props.id, props.roleId, props.roleName.trim()));
  }

  getUserId(): UserId {
    return this.userId;
  }

  getRoleId(): number {
    return this.roleId;
  }

  getRoleName(): string {
    return this.roleName;
  }

  /**
   * Checks if this identity has at least the given role level.
   * Lower roleId = higher rank, so this.roleId <= required means
   * "I am at least as privileged as the required minimum".
   */
  hasRole(requiredRoleId: number): boolean {
    return this.roleId <= requiredRoleId;
  }

  equals(other: UserIdentity): boolean {
    return (
      this.userId.equals(other.userId) &&
      this.roleId === other.roleId &&
      this.roleName === other.roleName
    );
  }

  toString(): string {
    return `UserIdentity(${this.userId.toString()}, ${this.roleName}(${this.roleId}))`;
  }
}
