"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleVO = exports.USUARIO_ROLE_ID = exports.TECNICO_ROLE_ID = exports.SUPERVISOR_ROLE_ID = exports.ADMIN_ROLE_ID = void 0;
const result_1 = require("../result");
/**
 * Predefined role IDs (hierarchy by numeric value: lower = higher rank).
 * Use these constants instead of the old Role enum.
 */
exports.ADMIN_ROLE_ID = 1;
exports.SUPERVISOR_ROLE_ID = 2;
exports.TECNICO_ROLE_ID = 3;
exports.USUARIO_ROLE_ID = 4;
/**
 * Role Value Object.
 *
 * Wraps a numeric role ID with its human-readable name.
 * Guarantees that only valid role IDs are represented.
 *
 * Hierarchy: lower ID = higher rank.
 *   Admin(1) > Supervisor(2) > Técnico(3) > Usuario(4)
 */
class RoleVO {
    id;
    name;
    constructor(id, name) {
        this.id = id;
        this.name = name;
        Object.freeze(this);
    }
    static create(id, name) {
        if (!Number.isInteger(id) || id <= 0) {
            return (0, result_1.err)(new Error('Role ID must be a positive integer'));
        }
        if (!name || name.trim().length === 0) {
            return (0, result_1.err)(new Error('Role name cannot be empty'));
        }
        return (0, result_1.ok)(new RoleVO(id, name.trim()));
    }
    static reconstruct(id, name) {
        return new RoleVO(id, name);
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    /** @deprecated Use getId() instead — kept for migration compatibility */
    get() {
        return this.id;
    }
    equals(other) {
        return this.id === other.id && this.name === other.name;
    }
    toString() {
        return this.name;
    }
    /**
     * Checks if this role has at least the rank of the given minimum role ID.
     * Lower ID = higher rank, so this.id <= minimum means "I am at least as
     * privileged as the required minimum".
     */
    isAtLeast(minimumId) {
        return this.id <= minimumId;
    }
    static default() {
        return new RoleVO(exports.USUARIO_ROLE_ID, 'Usuario');
    }
}
exports.RoleVO = RoleVO;
//# sourceMappingURL=role.js.map