"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleVO = exports.Role = void 0;
const result_1 = require("../result");
/**
 * Role enum — user authorization levels.
 *
 * Hierarchical: Admin > Supervisor > Tecnico > Usuario
 */
var Role;
(function (Role) {
    Role["Admin"] = "Admin";
    Role["Supervisor"] = "Supervisor";
    Role["Tecnico"] = "Tecnico";
    Role["Usuario"] = "Usuario";
})(Role || (exports.Role = Role = {}));
const VALID_ROLES = Object.values(Role);
/**
 * Role Value Object.
 *
 * Wraps a Role enum with safe construction and comparison.
 * Guarantees that only valid system roles are represented.
 */
class RoleVO {
    value;
    constructor(value) {
        this.value = value;
        Object.freeze(this);
    }
    static create(raw) {
        if (!raw || raw.trim().length === 0) {
            return (0, result_1.err)(new Error('Role cannot be empty'));
        }
        const normalized = raw.trim();
        // Accept both "Admin" and "admin", but always store the canonical form
        const match = VALID_ROLES.find((r) => r.toLowerCase() === normalized.toLowerCase());
        if (!match) {
            return (0, result_1.err)(new Error(`Invalid role '${raw}'. Valid roles: ${VALID_ROLES.join(', ')}`));
        }
        return (0, result_1.ok)(new RoleVO(match));
    }
    static reconstruct(raw) {
        return new RoleVO(raw);
    }
    get() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
    toString() {
        return this.value;
    }
    isAtLeast(minimum) {
        const hierarchy = [Role.Admin, Role.Supervisor, Role.Tecnico, Role.Usuario];
        const currentIndex = hierarchy.indexOf(this.value);
        const minimumIndex = hierarchy.indexOf(minimum);
        return currentIndex >= 0 && currentIndex <= minimumIndex;
    }
    static default() {
        return new RoleVO(Role.Usuario);
    }
}
exports.RoleVO = RoleVO;
//# sourceMappingURL=role.js.map