import { DomainError } from '../../shared/errors/domain-error';

export class GroupNotFoundError extends DomainError {
  readonly code = 'GROUP_NOT_FOUND';
  constructor(groupId: string) {
    super(`Group not found: ${groupId}`);
  }
}

export class NotGroupMemberError extends DomainError {
  readonly code = 'NOT_GROUP_MEMBER';
  constructor(userId: string, groupId: string) {
    super(`User ${userId} is not a member of group ${groupId}`);
  }
}

export class NotGroupAdminError extends DomainError {
  readonly code = 'NOT_GROUP_ADMIN';
  constructor(userId: string, groupId: string) {
    super(`User ${userId} is not an admin of group ${groupId}`);
  }
}

export class GroupAlreadyExistsError extends DomainError {
  readonly code = 'GROUP_ALREADY_EXISTS';
  constructor(name: string) {
    super(`Group with name "${name}" already exists`);
  }
}
