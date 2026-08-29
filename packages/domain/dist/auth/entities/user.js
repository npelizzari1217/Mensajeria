"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const user_id_1 = require("../../shared/value-objects/user-id");
const timestamp_1 = require("../../shared/value-objects/timestamp");
const result_1 = require("../../shared/result");
/**
 * User entity — aggregate root for the Auth bounded context.
 *
 * Encapsulates identity, credentials, and role-based authorization.
 * Behavior methods enforce domain invariants:
 * - Password validation on creation (delegated to Password VO)
 * - Role assignment permissions
 * - Message sending capability
 *
 * Role hierarchy (numeric roleId): 1=Admin, 2=Supervisor, 3=Técnico, 4=Usuario.
 * Lower ID = higher rank.
 */
class User {
    id;
    email;
    name;
    roleId;
    hashedPassword;
    createdAt;
    updatedAt;
    constructor(id, email, name, roleId, hashedPassword, createdAt, updatedAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.roleId = roleId;
        this.hashedPassword = hashedPassword;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    /**
     * Factory for NEW users (registration).
     * Plaintext password is validated by Password.create().
     * The returned user uses the raw plaintext — the application use case
     * MUST hash it via PasswordHasher before calling user.changePassword().
     *
     * Default roleId: 4 (Usuario).
     */
    static create(props) {
        if (!props.name || props.name.trim().length === 0) {
            return (0, result_1.err)(new Error('User name cannot be empty'));
        }
        const roleId = props.roleId ?? 4; // default: Usuario
        return (0, result_1.ok)(new User(user_id_1.UserId.reconstruct(crypto.randomUUID()), props.email, props.name.trim(), roleId, props.password.get(), // plaintext until hashed by use case
        timestamp_1.Timestamp.now(), timestamp_1.Timestamp.now()));
    }
    /**
     * Reconstruction from persistence — skips runtime validation.
     * Use ONLY when restoring from a trusted source (DB).
     */
    static reconstruct(props) {
        return new User(props.id, props.email, props.name, props.roleId, props.hashedPassword, props.createdAt, props.updatedAt);
    }
    // --- Identity ---
    getId() {
        return this.id;
    }
    getEmail() {
        return this.email;
    }
    getName() {
        return this.name;
    }
    getRoleId() {
        return this.roleId;
    }
    getHashedPassword() {
        return this.hashedPassword;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getUpdatedAt() {
        return this.updatedAt;
    }
    // --- Behavior ---
    /**
     * Checks if the user has sufficient privileges to send messages.
     * All authenticated users can send messages.
     */
    canSendMessage() {
        return true;
    }
    /**
     * Checks if the user can assign the given target role to another user.
     *
     * Hierarchy rules:
     *   Admin(1)       → can assign any role (all roleIds)
     *   Supervisor(2)  → can only assign roles with roleId >= 3 (Técnico, Usuario)
     *   Técnico(3)     → cannot assign roles
     *   Usuario(4)     → cannot assign roles
     */
    canAssignRole(targetRoleId) {
        if (this.roleId === 1)
            return true; // Admin can assign any role
        if (this.roleId === 2 && targetRoleId >= 3)
            return true; // Supervisor → Técnico / Usuario
        return false;
    }
    /**
     * Updates the user's hashed password.
     * Called by the use case AFTER hashing via PasswordHasher.
     */
    setHashedPassword(hash) {
        this.hashedPassword = hash;
        this.updatedAt = timestamp_1.Timestamp.now();
    }
    /**
     * Updates the user's display name.
     */
    changeName(newName) {
        if (!newName || newName.trim().length === 0) {
            return (0, result_1.err)(new Error('Name cannot be empty'));
        }
        this.name = newName.trim();
        this.updatedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(undefined);
    }
    /**
     * Updates the user's role.
     * Only call after verifying the caller has canAssignRole(newRoleId).
     */
    changeRoleId(newRoleId) {
        this.roleId = newRoleId;
        this.updatedAt = timestamp_1.Timestamp.now();
    }
    /**
     * Updates the user's email.
     */
    changeEmail(newEmail) {
        this.email = newEmail;
        this.updatedAt = timestamp_1.Timestamp.now();
    }
    /**
     * Returns the user's public identity for authorization context.
     */
    getIdentity() {
        return { userId: this.id, roleId: this.roleId };
    }
}
exports.User = User;
// Polyfill for environments that may not have crypto.randomUUID
function getRandomUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for testing environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
//# sourceMappingURL=user.js.map