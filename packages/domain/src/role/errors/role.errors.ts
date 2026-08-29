import { DomainError } from '../../shared/errors/domain-error';

/**
 * Error when attempting to create a role with an already-used name.
 */
export class RoleNameAlreadyExistsError extends DomainError {
  readonly code = 'ROLE_NAME_ALREADY_EXISTS';

  constructor(name: string) {
    super(`Role name '${name}' is already taken`);
  }
}

/**
 * Error when attempting to delete a role that has users assigned.
 */
export class RoleHasUsersError extends DomainError {
  readonly code = 'ROLE_HAS_USERS';

  constructor(id: number) {
    super(`Cannot delete role ${id}: there are users assigned to it`);
  }
}
