"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMember = void 0;
const timestamp_1 = require("../../shared/value-objects/timestamp");
const crypto_1 = __importDefault(require("crypto"));
/**
 * GroupMember entity.
 *
 * Represents a user's membership in a group with a specific role.
 */
class GroupMember {
    id;
    groupId;
    userId;
    role;
    joinedAt;
    constructor(id, groupId, userId, role, joinedAt) {
        this.id = id;
        this.groupId = groupId;
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt;
    }
    static create(groupId, userId, role) {
        return new GroupMember(crypto_1.default.randomUUID(), groupId, userId, role, timestamp_1.Timestamp.now());
    }
    static reconstruct(props) {
        return new GroupMember(props.id, props.groupId, props.userId, props.role, props.joinedAt);
    }
    getId() {
        return this.id;
    }
    getGroupId() {
        return this.groupId;
    }
    getUserId() {
        return this.userId;
    }
    getRole() {
        return this.role;
    }
    getJoinedAt() {
        return this.joinedAt;
    }
    changeRole(newRole) {
        this.role = newRole;
    }
    equals(other) {
        return this.id === other.id;
    }
}
exports.GroupMember = GroupMember;
//# sourceMappingURL=group-member.js.map