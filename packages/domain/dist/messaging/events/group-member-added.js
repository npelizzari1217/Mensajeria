"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupMemberAdded = void 0;
class GroupMemberAdded {
    groupId;
    userId;
    addedBy;
    eventName = 'group.member-added';
    occurredAt = new Date();
    constructor(groupId, userId, addedBy) {
        this.groupId = groupId;
        this.userId = userId;
        this.addedBy = addedBy;
    }
}
exports.GroupMemberAdded = GroupMemberAdded;
//# sourceMappingURL=group-member-added.js.map