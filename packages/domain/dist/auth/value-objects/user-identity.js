"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserIdentity = void 0;
const result_1 = require("../../shared/result");
/**
 * UserIdentity Value Object.
 *
 * Represents an authenticated user's identity for authorization checks.
 * Injected into request context by AuthGuard after token verification.
 * Carries userId + role for roles.guard.ts checks.
 */
class UserIdentity {
    userId;
    role;
    constructor(userId, role) {
        this.userId = userId;
        this.role = role;
        Object.freeze(this);
    }
    static create(userId, role) {
        if (!userId) {
            return (0, result_1.err)(new Error('UserIdentity requires a valid UserId'));
        }
        if (!role) {
            return (0, result_1.err)(new Error('UserIdentity requires a valid Role'));
        }
        return (0, result_1.ok)(new UserIdentity(userId, role));
    }
    getUserId() {
        return this.userId;
    }
    getRole() {
        return this.role;
    }
    /**
     * Checks if this identity has at least the given role level.
     */
    hasRole(minimum) {
        return this.role.isAtLeast(minimum);
    }
    equals(other) {
        return this.userId.equals(other.userId) && this.role.equals(other.role);
    }
    toString() {
        return `UserIdentity(${this.userId.toString()}, ${this.role.toString()})`;
    }
}
exports.UserIdentity = UserIdentity;
//# sourceMappingURL=user-identity.js.map