"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRegistered = void 0;
/**
 * Domain event emitted when a new user registers successfully.
 *
 * Handlers can use this to send welcome emails, create default
 * preferences, audit-log the registration, etc.
 */
class UserRegistered {
    userId;
    email;
    name;
    roleId;
    roleName;
    eventName = 'UserRegistered';
    occurredAt = new Date();
    constructor(userId, email, name, roleId, roleName) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.roleId = roleId;
        this.roleName = roleName;
    }
}
exports.UserRegistered = UserRegistered;
//# sourceMappingURL=user-registered.js.map