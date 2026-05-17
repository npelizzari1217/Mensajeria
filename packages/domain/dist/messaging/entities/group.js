"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const timestamp_1 = require("../../shared/value-objects/timestamp");
const result_1 = require("../../shared/result");
const group_member_1 = require("./group-member");
const group_role_1 = require("../value-objects/group-role");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Group entity — aggregate root for the Groups bounded context.
 *
 * Represents a team or department within the organization.
 * Users can be members of groups with different roles.
 */
class Group {
    id;
    name;
    description;
    createdBy;
    members;
    isActive;
    createdAt;
    updatedAt;
    constructor(id, name, description, createdBy, members, isActive, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdBy = createdBy;
        this.members = members;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    /**
     * Factory for NEW groups.
     */
    static create(name, description, createdBy) {
        if (!name || name.trim().length === 0) {
            return (0, result_1.err)(new Error('Group name is required'));
        }
        if (name.length > 100) {
            return (0, result_1.err)(new Error('Group name must be 100 characters or less'));
        }
        const id = crypto_1.default.randomUUID();
        const now = timestamp_1.Timestamp.now();
        const adminMember = group_member_1.GroupMember.create(id, createdBy, group_role_1.GroupRole.ADMIN);
        return (0, result_1.ok)(new Group(id, name.trim(), description, createdBy, [adminMember], true, now, now));
    }
    /**
     * Reconstruction from persistence.
     */
    static reconstruct(props) {
        return new Group(props.id, props.name, props.description, props.createdBy, props.members, props.isActive, props.createdAt, props.updatedAt);
    }
    // --- Identity ---
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getDescription() {
        return this.description;
    }
    getCreatedBy() {
        return this.createdBy;
    }
    getMembers() {
        return [...this.members];
    }
    isActiveGroup() {
        return this.isActive;
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getUpdatedAt() {
        return this.updatedAt;
    }
    // --- Member management ---
    /**
     * Adds a member to the group with the given role.
     * Requires the requester to be a GroupAdmin.
     */
    addMember(userId, role, requesterId) {
        if (!this.isActive) {
            return (0, result_1.err)(new Error('Cannot add members to an inactive group'));
        }
        if (!this.isAdmin(requesterId)) {
            return (0, result_1.err)(new Error('Only group admins can add members'));
        }
        const existing = this.members.find((m) => m.getUserId().equals(userId));
        if (existing) {
            return (0, result_1.err)(new Error('User is already a member of this group'));
        }
        const member = group_member_1.GroupMember.create(this.id, userId, role);
        this.members.push(member);
        this.updatedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(member);
    }
    /**
     * Removes a member from the group.
     */
    removeMember(userId, requesterId) {
        if (!this.isActive) {
            return (0, result_1.err)(new Error('Cannot remove members from an inactive group'));
        }
        if (!this.isAdmin(requesterId)) {
            return (0, result_1.err)(new Error('Only group admins can remove members'));
        }
        if (userId.equals(requesterId)) {
            return (0, result_1.err)(new Error('Admin cannot remove themselves. Use leaveGroup instead.'));
        }
        const index = this.members.findIndex((m) => m.getUserId().equals(userId));
        if (index === -1) {
            return (0, result_1.err)(new Error('User is not a member of this group'));
        }
        this.members.splice(index, 1);
        this.updatedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(undefined);
    }
    /**
     * User leaves the group on their own.
     */
    leaveGroup(userId) {
        const index = this.members.findIndex((m) => m.getUserId().equals(userId));
        if (index === -1) {
            return (0, result_1.err)(new Error('User is not a member of this group'));
        }
        this.members.splice(index, 1);
        this.updatedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(undefined);
    }
    /**
     * Changes a member's role.
     */
    changeMemberRole(userId, newRole, requesterId) {
        if (!this.isAdmin(requesterId)) {
            return (0, result_1.err)(new Error('Only group admins can change roles'));
        }
        const member = this.members.find((m) => m.getUserId().equals(userId));
        if (!member) {
            return (0, result_1.err)(new Error('User is not a member of this group'));
        }
        member.changeRole(newRole);
        this.updatedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(member);
    }
    /**
     * Deactivates the group (soft delete).
     */
    deactivate(requesterId) {
        if (!this.isAdmin(requesterId)) {
            return (0, result_1.err)(new Error('Only group admins can deactivate the group'));
        }
        this.isActive = false;
        this.updatedAt = timestamp_1.Timestamp.now();
        return (0, result_1.ok)(undefined);
    }
    // --- Queries ---
    isAdmin(userId) {
        return this.members.some((m) => m.getUserId().equals(userId) && m.getRole().isAdmin());
    }
    isMember(userId) {
        return this.members.some((m) => m.getUserId().equals(userId));
    }
    getMember(userId) {
        return this.members.find((m) => m.getUserId().equals(userId));
    }
    getActiveMemberIds() {
        return this.members.map((m) => m.getUserId());
    }
    equals(other) {
        return this.id === other.id;
    }
}
exports.Group = Group;
//# sourceMappingURL=group.js.map