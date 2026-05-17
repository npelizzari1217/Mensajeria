"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupCreated = void 0;
class GroupCreated {
    groupId;
    name;
    createdBy;
    eventName = 'group.created';
    occurredAt = new Date();
    constructor(groupId, name, createdBy) {
        this.groupId = groupId;
        this.name = name;
        this.createdBy = createdBy;
    }
}
exports.GroupCreated = GroupCreated;
//# sourceMappingURL=group-created.js.map