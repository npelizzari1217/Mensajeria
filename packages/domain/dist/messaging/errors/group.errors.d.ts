import { DomainError } from '../../shared/errors/domain-error';
export declare class GroupNotFoundError extends DomainError {
    readonly code = "GROUP_NOT_FOUND";
    constructor(groupId: string);
}
export declare class NotGroupMemberError extends DomainError {
    readonly code = "NOT_GROUP_MEMBER";
    constructor(userId: string, groupId: string);
}
export declare class NotGroupAdminError extends DomainError {
    readonly code = "NOT_GROUP_ADMIN";
    constructor(userId: string, groupId: string);
}
export declare class GroupAlreadyExistsError extends DomainError {
    readonly code = "GROUP_ALREADY_EXISTS";
    constructor(name: string);
}
//# sourceMappingURL=group.errors.d.ts.map