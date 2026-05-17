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
    role;
    eventName = 'UserRegistered';
    occurredAt = new Date();
    constructor(userId, email, name, role) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
    }
}
exports.UserRegistered = UserRegistered;
//# sourceMappingURL=user-registered.js.map