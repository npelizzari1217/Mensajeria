"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserIdentity = void 0;
const result_1 = require("../../shared/result");
/**
 * UserIdentity Value Object.
 *
 * Represents an authenticated user's identity for authorization checks.
 * Injected into request context by AuthGuard after token verification.
 * Carries userId + roleId + roleName for consistent authorization.
 */
class UserIdentity {
    userId;
    roleId;
    roleName;
    constructor(userId, roleId, roleName) {
        this.userId = userId;
        this.roleId = roleId;
        this.roleName = roleName;
        Object.freeze(this);
    }
    static from(props) {
        if (!props.id) {
            return (0, result_1.err)(new Error('UserIdentity requires a valid UserId'));
        }
        if (!Number.isInteger(props.roleId) || props.roleId <= 0) {
            return (0, result_1.err)(new Error('UserIdentity requires a valid roleId (positive integer)'));
        }
        if (!props.roleName || props.roleName.trim().length === 0) {
            return (0, result_1.err)(new Error('UserIdentity requires a valid roleName'));
        }
        return (0, result_1.ok)(new UserIdentity(props.id, props.roleId, props.roleName.trim()));
    }
    getUserId() {
        return this.userId;
    }
    getRoleId() {
        return this.roleId;
    }
    getRoleName() {
        return this.roleName;
    }
    /**
     * Checks if this identity has at least the given role level.
     * Lower roleId = higher rank, so this.roleId <= required means
     * "I am at least as privileged as the required minimum".
     */
    hasRole(requiredRoleId) {
        return this.roleId <= requiredRoleId;
    }
    equals(other) {
        return (this.userId.equals(other.userId) &&
            this.roleId === other.roleId &&
            this.roleName === other.roleName);
    }
    toString() {
        return `UserIdentity(${this.userId.toString()}, ${this.roleName}(${this.roleId}))`;
    }
}
exports.UserIdentity = UserIdentity;
//# sourceMappingURL=user-identity.js.map