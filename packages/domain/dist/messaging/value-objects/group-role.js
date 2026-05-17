"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRole = void 0;
/**
 * GroupRole Value Object.
 *
 * Roles dentro de un grupo: ADMIN (puede gestionar miembros, editar grupo)
 * y MEMBER (puede enviar al grupo y ver miembros).
 */
class GroupRole {
    value;
    constructor(value) {
        this.value = value;
    }
    static ADMIN = new GroupRole('ADMIN');
    static MEMBER = new GroupRole('MEMBER');
    static create(value) {
        const normalized = value.toUpperCase();
        if (normalized !== 'ADMIN' && normalized !== 'MEMBER') {
            throw new Error(`Invalid group role: ${value}. Must be ADMIN or MEMBER`);
        }
        return new GroupRole(normalized);
    }
    isAdmin() {
        return this.value === 'ADMIN';
    }
    isMember() {
        return this.value === 'MEMBER';
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
}
exports.GroupRole = GroupRole;
//# sourceMappingURL=group-role.js.map