"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupAlreadyExistsError = exports.NotGroupAdminError = exports.NotGroupMemberError = exports.GroupNotFoundError = void 0;
const domain_error_1 = require("../../shared/errors/domain-error");
class GroupNotFoundError extends domain_error_1.DomainError {
    code = 'GROUP_NOT_FOUND';
    constructor(groupId) {
        super(`Group not found: ${groupId}`);
    }
}
exports.GroupNotFoundError = GroupNotFoundError;
class NotGroupMemberError extends domain_error_1.DomainError {
    code = 'NOT_GROUP_MEMBER';
    constructor(userId, groupId) {
        super(`User ${userId} is not a member of group ${groupId}`);
    }
}
exports.NotGroupMemberError = NotGroupMemberError;
class NotGroupAdminError extends domain_error_1.DomainError {
    code = 'NOT_GROUP_ADMIN';
    constructor(userId, groupId) {
        super(`User ${userId} is not an admin of group ${groupId}`);
    }
}
exports.NotGroupAdminError = NotGroupAdminError;
class GroupAlreadyExistsError extends domain_error_1.DomainError {
    code = 'GROUP_ALREADY_EXISTS';
    constructor(name) {
        super(`Group with name "${name}" already exists`);
    }
}
exports.GroupAlreadyExistsError = GroupAlreadyExistsError;
//# sourceMappingURL=group.errors.js.map