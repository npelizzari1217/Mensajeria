"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMemberRemoved = void 0;
class GroupMemberRemoved {
    groupId;
    userId;
    removedBy;
    eventName = 'group.member-removed';
    occurredAt = new Date();
    constructor(groupId, userId, removedBy) {
        this.groupId = groupId;
        this.userId = userId;
        this.removedBy = removedBy;
    }
}
exports.GroupMemberRemoved = GroupMemberRemoved;
//# sourceMappingURL=group-member-removed.js.map